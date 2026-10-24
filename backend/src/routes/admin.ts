import { Router, Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    email?: string;
    role?: 'Guest' | 'Free' | 'Subscriber' | 'Admin' | string;
    [key: string]: any;
  };
}

const router = Router();

// Middleware to enforce Admin role (assumes req.user is populated by prior auth middleware)
function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
}

router.use(requireAdmin as any);

// === USER MANAGEMENT ===

// Get all users with their current roles and usage counters
router.get('/users', async (_req: Request, res: Response) => {
  try {
    // Replace with actual database fetch
    const users = [
      { id: '1', email: 'guest@example.com', role: 'Guest', monthly_usage_seconds: 1200 },
      { id: '2', email: 'pro@example.com', role: 'Subscriber', subscription_status: 'active' },
    ];
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user role
router.patch('/users/:id/role', async (req: Request, res: Response) => {
  const { role } = req.body ?? {};
  const validRoles = ['Guest', 'Free', 'Subscriber', 'Admin'];

  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role provided' });
  }
  // DB update logic here
  res.json({ success: true, message: `User ${req.params.id} updated to ${role}` });
});

// === FEED MANAGEMENT ===

// Add a new feed source
router.post('/feeds', async (req: Request, res: Response) => {
  const { name, type, city, state, zip, stream_url } = req.body ?? {};
  const newFeed = { id: Date.now().toString(), name, type, stream_url, is_active: true };
  // DB insert logic here
  res.status(201).json({ feed: newFeed });
});

// Toggle feed active status
router.patch('/feeds/:id/status', async (req: Request, res: Response) => {
  const { is_active } = req.body ?? {};
  // DB update logic here
  res.json({ success: true, is_active });
});

export default router;
