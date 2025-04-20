import express  from "express";
import { clerkClient, clerkMiddleware, getAuth, requireAuth, User } from '@clerk/express'
import dotenv from "dotenv";
import { PrismaClient } from '@prisma/client'
import { syncUser } from "./sync";
import cors from "cors"
import router from "./fileUpload";
import WebSocket from "ws";
import { WebSocketServer } from "ws";
import http from "http"
import Redis from 'redis';
import nodemailer from 'nodemailer';
import { createClient,RedisClientType  } from 'redis';
import swaggerUi from 'swagger-ui-express';
import { oas } from "./oas";

const app = express();
const port =3000; 
app.use(express.json());
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const prisma = new PrismaClient(); 

// Ensure Redis client is properly initialized
const redisClient = createClient({ 
  url: process.env.REDIS_URL || 'redis://redis-service:6379'
}); 

const corsOptions = {
  origin: "*", 
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

dotenv.config();

app.use(clerkMiddleware()); 

const userConnections = new Map<string, WebSocket>();

// Connect to Redis and handle connection errors
redisClient.connect().catch(console.error); 

app.get('/api/debug', (req, res) => {
  res.json({ status: 'ok', message: 'API is working' });
});

wss.on('connection', async (ws, req) => {
  try {
    const userId = req.url?.split('userId=')[1];
    if (!userId) {
      ws.close();
      return;
    }

    userConnections.set(userId, ws);
    console.log(`User ${userId} connected`);

    ws.on('close', () => {
      userConnections.delete(userId);
      console.log(`User ${userId} disconnected`);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for user ${userId}:`, error);
    });
  } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close();
    }
  });

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false, // true for 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

const redisPublisher: RedisClientType = createClient({ 
  url: process.env.REDIS_URL || 'redis://redis-service:6379'
});
const redisSubscriber: RedisClientType = createClient({ 
  url: process.env.REDIS_URL || 'redis://redis-service:6379'
});

redisPublisher.connect().catch(console.error);
redisSubscriber.connect().catch(console.error);

redisSubscriber.subscribe('blog:created', async (message: string) => {
  try {
    const { blogId, authorEmail } = JSON.parse(message);

    const blog = await prisma.blog.findUnique({ where: { id: blogId } });

    await transporter.sendMail({
      from: '"Blog Platform" <noreply@example.com>',
      to: authorEmail,
      subject: "New Blog Published!",
      html: `<p>Your blog "<b>${blog?.title}</b>" is now live!</p>`,
    });

    console.log(`Email sent to ${authorEmail}`);
  } catch (error) {
    console.error("Email sending failed:", error);
  }
});

app.use('/documentation', swaggerUi.serve, swaggerUi.setup(oas));

// Notification routes
app.get('/api/user/notifications', requireAuth(), async (req, res) => {
  try {
    const prismaUser = await syncUser(req);
    const notifications = await prisma.notification.findMany({
      where: { userId: prismaUser.id },
      orderBy: { createdAt: 'desc' }, // Changed to desc for newest first
      take: 20
    });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.patch('/api/user/notifications/:id/read', requireAuth(), async (req, res) => {
  try {
    const prismaUser = await syncUser(req);
    const notification = await prisma.notification.update({
      where: { id: req.params.id, userId: prismaUser.id },
      data: { read: true }
    });
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

app.patch('/api/user/notifications/mark-all-read', requireAuth(), async (req, res) => {
  try {
    const prismaUser = await syncUser(req);
    await prisma.notification.updateMany({
      where: { 
        userId: prismaUser.id,
        read: false
      },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// User profile route
app.get('/api/user/profile', requireAuth(), async (req, res) => {
  try {
    console.log("Profile request received");
    const prismaUser = await syncUser(req);
    
    // Add error handling for blog count query
    let blogCount = 0;
    try {
      blogCount = await prisma.blog.count({
        where: { authorId: prismaUser.id }
      });
    } catch (error) {
      console.error('Error counting blogs:', error);
      // Continue without failing the request
    }
    
    const userProfile = {
      ...prismaUser,
      blogCount
    };
    
    console.log("Returning profile:", userProfile);
    res.json(userProfile);
  } catch (error:any) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile', details: error.message });
  }
});

// Basic routes
app.get('/', (req, res) => {
  res.send('Avira API Server')
});

app.get('/health', async (req, res) => {
  const status = {
    database: false,
    redis: false,
  };

  try {
    //pg
    await prisma.$queryRaw`SELECT 1`;
    status.database = true;

    //redis
    const ping = await redisClient.ping();
    if (ping === 'PONG') {
      status.redis = true;
    }

    res.status(200).json({
      status: 'healthy',
      services: status,
      timestamp: new Date().toISOString(),
    });
  } 
  catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      services: status,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/ws-health', (req, res) => {
  if (wss.clients.size > 0) {
    res.status(200).json({ ws: 'healthy' });
  } else {
    res.status(200).json({ ws: 'no-connections' });
  }
});

// File upload routes
app.use("/api/user", router); 

// User route
app.get('/api/user', requireAuth(), async (req, res) => {
  const prismaUser = await syncUser(req);
  res.json(prismaUser); 
});

// Get all blogs by the current user
app.get('/api/user/blogs', requireAuth(), async (req, res) => {
  try {
    const prismaUser = await syncUser(req);
    
    const userBlogs = await prisma.blog.findMany({
      where: { authorId: prismaUser.id },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(userBlogs);
  } catch (error) {
    console.error('Error fetching user blogs:', error);
    res.status(500).json({ error: 'Failed to fetch user blogs' });
  }
});

// Delete a blog by ID (only if owned by current user)
app.delete('/api/user/blog/:blogId', requireAuth(), async (req, res) => {
  try {
    const prismaUser = await syncUser(req);
    const { blogId } = req.params;
    
    // First check if blog exists and belongs to the user
    const blog = await prisma.blog.findFirst({
      where: {
        id: blogId,
        authorId: prismaUser.id
      }
    });
    
    if (!blog) {
      res.status(404).json({ error: 'Blog not found or you do not have permission to delete it' });
      return;
    }
    
    // Delete the blog
    await prisma.blog.delete({
      where: { id: blogId }
    });
    
    // Create notification for deletion
    const notification = await prisma.notification.create({
      data: {
        message: `Your blog "${blog.title}" was deleted successfully!`,
        userId: prismaUser.id
      }
    });
    
    // Send websocket notification if user is connected
    const userWs = userConnections.get(prismaUser.id);
    if (userWs?.readyState === WebSocket.OPEN) {
      userWs.send(JSON.stringify({
        type: 'notification',
        data: notification
      }));
    }
    
    // Invalidate cache for blogs
    try {
      const cacheKeys = await redisClient.keys('blogs:*');
      if (cacheKeys.length > 0) {
        await redisClient.del(cacheKeys);
      }
    } catch (redisError) {
      console.error('Redis cache invalidation error:', redisError);
      // Continue without failing the request
    }
    
    res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
});

// Update a blog (only if owned by current user)
app.put('/api/user/blog/:blogId', requireAuth(), async (req, res) => {
  try {
    const prismaUser = await syncUser(req);
    const { blogId } = req.params;
    const { title, content, published } = req.body;
    
    // Check if blog exists and belongs to the user
    const blog = await prisma.blog.findFirst({
      where: {
        id: blogId,
        authorId: prismaUser.id
      }
    });
    
    if (!blog) {
      res.status(404).json({ error: 'Blog not found or you do not have permission to update it' });
      return;
    }
    
    // Update the blog
    const updatedBlog = await prisma.blog.update({
      where: { id: blogId },
      data: { 
        title, 
        content,
        published: published !== undefined ? published : blog.published
      }
    });
    
    // Create notification for update
    const notification = await prisma.notification.create({
      data: {
        message: `Your blog "${updatedBlog.title}" was updated successfully!`,
        userId: prismaUser.id
      }
    });
    
    // Send websocket notification if user is connected
    const userWs = userConnections.get(prismaUser.id);
    if (userWs?.readyState === WebSocket.OPEN) {
      userWs.send(JSON.stringify({
        type: 'notification',
        data: notification
      }));
    }
    
    // Invalidate cache for blogs
    try {
      const cacheKeys = await redisClient.keys('blogs:*');
      if (cacheKeys.length > 0) {
        await redisClient.del(cacheKeys);
      }
    } catch (redisError) {
      console.error('Redis cache invalidation error:', redisError);
      // Continue without failing the request
    }
    
    res.json(updatedBlog);
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ error: 'Failed to update blog' });
  }
});

// Get all blogs with pagination
app.get('/api/blogs', requireAuth(), async (req, res): Promise<void> => {
  try {
    const pages = Number(req.query.pages) || 1;
    const sortOption = req.query.sort || 'newest';
    const limit = sortOption === 'all' ? 999 : 3; // Show more items when "View All" is selected
    
    const cacheKey = `blogs:${pages}:${sortOption}`;
    let cachedData;
    
    try {
      cachedData = await redisClient.get(cacheKey);
    } catch (redisError) {
      console.error('Redis get error:', redisError);
      // Continue without using cache
    }
    
    if (cachedData) {
      res.json(JSON.parse(cachedData));
      return;
    }
    
    // Determine sort order using Prisma's expected format
    const orderBy = {
      createdAt: sortOption === 'oldest' ? 'asc' : 'desc'
    } as const; // Use const assertion for TypeScript
    
    const all = await prisma.blog.findMany({
      include: {
        author: true
      },
      orderBy,
      skip: (pages - 1) * limit,
      take: limit
    });
    
    const totalItems = await prisma.blog.count();
    const totalPages = Math.ceil(totalItems / limit);
    
    const response = {
      totalItems,
      currentPage: pages,
      all,
      totalPages
    };
    
    res.json(response);
    
    try {
      await redisClient.setEx(cacheKey, 600, JSON.stringify(response));
    } catch (redisError) {
      console.error('Redis set error:', redisError);
      // Continue without caching
    }
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ msg: "Failed to get all blogs" });
  }
});

// Create a new blog post
app.post("/api/user/blog", requireAuth(), async(req, res) => {
  try {
    const prismaUser = await syncUser(req);
    const { title, content } = req.body;
    const blogs = await prisma.blog.create({
      data:{
        title,
        content,    
        authorId: prismaUser.id,
        published: true,
        extractedContents: [] // Ensure this matches your schema
      }
    });

    try {
      await redisPublisher.publish('blog:created', JSON.stringify({
        blogId: blogs.id,
        authorEmail: prismaUser.email, 
      }));
    } catch (redisError) {
      console.error('Redis publish error:', redisError);
      // Continue without failing the request
    }
    
    const notification = await prisma.notification.create({
      data: {
        message: `Your blog "${title}" was published successfully!`,
        userId: prismaUser.id
      }
    });
  
    const userWs = userConnections.get(prismaUser.id);
    if (userWs?.readyState === WebSocket.OPEN) {
      userWs.send(JSON.stringify({
        type: 'notification',
        data: notification
      }));
    }
  
    res.json(blogs);
  } catch (error:any) {
    console.error("Blog creation error:", error);
    res.status(500).json({ msg: "failed to post blog", error: error.message });
  }
});

// Get a specific blog
app.get("/api/blogs/:blogid", async(req, res) => {
  try {
    const {blogid} = req.params; 
    const uniqueblog = await prisma.blog.findUnique({
      where:{id: blogid},
      include: {  
        author: true
      }
    });
    
    if(!uniqueblog) {
      res.status(404).json({msg: "blog not found"});
      return;
    }
    
    res.json({uniqueblog}); 
  }
  catch(error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({msg: "failed to get blog"});
  }
});

server.listen(port, '0.0.0.0', () => {  
  console.log(`Server running on port ${port}`);
});