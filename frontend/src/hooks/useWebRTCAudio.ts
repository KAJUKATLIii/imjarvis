import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '../services/socket';

interface WebRTCProps {
  roomId: string | null;
  username: string;
  role: string;
  onCallEnd?: () => void;
}

export function useWebRTCAudio({ roomId, username, role, onCallEnd }: WebRTCProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [peerMuted, setPeerMuted] = useState(false);
  const [peerInfo, setPeerInfo] = useState<{ username: string; role: string } | null>(null);
  const [audioLevel, setAudioLevel] = useState(0); // 0 - 100 for visualizer
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const cleanupCall = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setPeerInfo(null);
    setAudioLevel(0);
  }, []);

  const endCall = useCallback(() => {
    if (roomId) {
      const socket = getSocket();
      socket.emit('webrtc:leave', { roomId });
    }
    cleanupCall();
    onCallEnd?.();
  }, [roomId, cleanupCall, onCallEnd]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const newMuteState = !isMuted;
        audioTracks[0].enabled = !newMuteState;
        setIsMuted(newMuteState);

        if (roomId) {
          getSocket().emit('webrtc:toggle-mute', { roomId, isMuted: newMuteState });
        }
      }
    }
  }, [isMuted, roomId]);

  useEffect(() => {
    if (!roomId) {
      cleanupCall();
      return;
    }

    let isMounted = true;
    const socket = getSocket();

    async function initAudioCall() {
      try {
        setIsConnecting(true);
        setError(null);

        // 1. Get Microphone
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;

        // 2. Setup Audio Visualizer
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVisualizer = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
            animationFrameRef.current = requestAnimationFrame(updateVisualizer);
          };
          updateVisualizer();
        } catch (e) {
          console.warn('AudioContext visualizer not supported or blocked:', e);
        }

        // 3. Create PeerConnection
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        });
        pcRef.current = pc;

        // Add local tracks
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // Handle remote tracks
        pc.ontrack = (event) => {
          if (!remoteAudioRef.current) {
            const audioEl = document.createElement('audio');
            audioEl.autoplay = true;
            document.body.appendChild(audioEl);
            remoteAudioRef.current = audioEl;
          }
          if (remoteAudioRef.current && event.streams[0]) {
            remoteAudioRef.current.srcObject = event.streams[0];
          }
        };

        // ICE candidate exchange
        pc.onicecandidate = (event) => {
          if (event.candidate && roomId) {
            socket.emit('webrtc:candidate', {
              roomId,
              candidate: event.candidate,
            });
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') {
            setIsConnected(true);
            setIsConnecting(false);
          } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            setIsConnected(false);
          }
        };

        // 4. Join Socket Room
        socket.emit('webrtc:join', { roomId, username, role });

        // 5. Signaling Listeners
        socket.on('webrtc:peer-joined', async (peer: { socketId: string; username: string; role: string }) => {
          setPeerInfo({ username: peer.username, role: peer.role });

          // Create Offer as the initial room occupant
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('webrtc:offer', { roomId, sdp: offer });
          } catch (err: any) {
            console.error('Failed to create offer:', err);
          }
        });

        socket.on('webrtc:room-peers', (data: { peers: string[] }) => {
          if (data.peers.length > 0) {
            setPeerInfo({ username: 'Remote Operator', role: 'ADMIN' });
          }
        });

        socket.on('webrtc:offer', async (data: { sdp: RTCSessionDescriptionInit }) => {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('webrtc:answer', { roomId, sdp: answer });
          } catch (err: any) {
            console.error('Failed to answer offer:', err);
          }
        });

        socket.on('webrtc:answer', async (data: { sdp: RTCSessionDescriptionInit }) => {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          } catch (err: any) {
            console.error('Failed to set remote answer:', err);
          }
        });

        socket.on('webrtc:candidate', async (data: { candidate: RTCIceCandidateInit }) => {
          try {
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
          } catch (err: any) {
            console.error('Failed to add ICE candidate:', err);
          }
        });

        socket.on('webrtc:peer-muted', (data: { isMuted: boolean }) => {
          setPeerMuted(data.isMuted);
        });

        socket.on('webrtc:peer-left', () => {
          setPeerInfo(null);
          setIsConnected(false);
        });
      } catch (err: any) {
        console.error('Microphone or WebRTC initialization error:', err);
        setError(err.message || 'Microphone access denied or unavailable.');
        setIsConnecting(false);
      }
    }

    initAudioCall();

    return () => {
      isMounted = false;
      socket.off('webrtc:peer-joined');
      socket.off('webrtc:room-peers');
      socket.off('webrtc:offer');
      socket.off('webrtc:answer');
      socket.off('webrtc:candidate');
      socket.off('webrtc:peer-muted');
      socket.off('webrtc:peer-left');
      cleanupCall();
    };
  }, [roomId, username, role, cleanupCall]);

  return {
    isConnected,
    isConnecting,
    isMuted,
    peerMuted,
    peerInfo,
    audioLevel,
    error,
    toggleMute,
    endCall,
  };
}
