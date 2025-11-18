import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import config from '../config';

/**
 * Socket.io Service for Real-Time Updates
 * Handles real-time generation progress, notifications, and chat
 */

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

class SocketService {
  private io: SocketIOServer | null = null;
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  /**
   * Initialize Socket.io server
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.frontendUrl,
        credentials: true,
      },
      path: '/socket.io/',
    });

    // Authentication middleware
    this.io.use((socket: any, next) => {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      try {
        const decoded = jwt.verify(token, config.jwt.secret) as any;
        socket.userId = decoded.userId;
        next();
      } catch (error) {
        return next(new Error('Authentication error: Invalid token'));
      }
    });

    // Connection handling
    this.io.on('connection', (socket: any) => {
      const userId = socket.userId;
      console.log(`✅ User ${userId} connected (socket: ${socket.id})`);

      // Map user to socket
      this.userSockets.set(userId, socket.id);

      // Join user's personal room
      socket.join(`user:${userId}`);

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`❌ User ${userId} disconnected`);
        this.userSockets.delete(userId);
      });

      // Handle custom events
      this.setupEventHandlers(socket);
    });

    console.log('🔌 Socket.io server initialized');
  }

  /**
   * Setup event handlers for a socket
   */
  private setupEventHandlers(socket: any): void {
    const userId = socket.userId;

    // Join project room for collaborative editing
    socket.on('join-project', (projectId: string) => {
      socket.join(`project:${projectId}`);
      console.log(`User ${userId} joined project ${projectId}`);
    });

    // Leave project room
    socket.on('leave-project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
      console.log(`User ${userId} left project ${projectId}`);
    });

    // Subscribe to generation job updates
    socket.on('subscribe-job', (jobId: string) => {
      socket.join(`job:${jobId}`);
      console.log(`User ${userId} subscribed to job ${jobId}`);
    });

    // Unsubscribe from generation job updates
    socket.on('unsubscribe-job', (jobId: string) => {
      socket.leave(`job:${jobId}`);
      console.log(`User ${userId} unsubscribed from job ${jobId}`);
    });

    // Chat message (for AI assistant)
    socket.on('chat-message', (data: { message: string; context?: any }) => {
      console.log(`Chat message from user ${userId}:`, data.message);
      // Process with AI assistant and respond
      // This would integrate with Claude service
    });

    // Ping/Pong for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });
  }

  /**
   * Send generation progress update to user
   */
  sendGenerationProgress(userId: string, jobId: string, progress: number, status: string): void {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit('generation-progress', {
      jobId,
      progress,
      status,
      timestamp: new Date().toISOString(),
    });

    console.log(`📊 Sent progress update to user ${userId}: ${progress}% (${status})`);
  }

  /**
   * Notify user of generation completion
   */
  sendGenerationComplete(userId: string, jobId: string, result: any): void {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit('generation-complete', {
      jobId,
      result,
      timestamp: new Date().toISOString(),
    });

    console.log(`✅ Sent completion notification to user ${userId} for job ${jobId}`);
  }

  /**
   * Notify user of generation failure
   */
  sendGenerationFailed(userId: string, jobId: string, error: string): void {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit('generation-failed', {
      jobId,
      error,
      timestamp: new Date().toISOString(),
    });

    console.log(`❌ Sent failure notification to user ${userId} for job ${jobId}`);
  }

  /**
   * Send real-time notification to user
   */
  sendNotification(userId: string, notification: {
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    action?: { label: string; url: string };
  }): void {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast to all connected users
   */
  broadcast(event: string, data: any): void {
    if (!this.io) return;

    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send message to specific project room (for collaboration)
   */
  sendToProject(projectId: string, event: string, data: any): void {
    if (!this.io) return;

    this.io.to(`project:${projectId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send AI chat response to user
   */
  sendChatResponse(userId: string, message: string, context?: any): void {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit('chat-response', {
      message,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send payment confirmation notification
   */
  sendPaymentConfirmation(userId: string, transactionId: string, credits: number): void {
    if (!this.io) return;

    this.sendNotification(userId, {
      type: 'success',
      title: 'Payment Successful! 🎉',
      message: `${credits} credits have been added to your account.`,
      action: {
        label: 'Start Creating',
        url: '/create',
      },
    });
  }

  /**
   * Send credit low warning
   */
  sendCreditLowWarning(userId: string, creditsRemaining: number): void {
    if (!this.io) return;

    this.sendNotification(userId, {
      type: 'warning',
      title: 'Credits Running Low',
      message: `You have ${creditsRemaining} credits remaining. Top up to keep creating!`,
      action: {
        label: 'Buy Credits',
        url: '/account/credits',
      },
    });
  }

  /**
   * Get Socket.io instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}

export default new SocketService();
