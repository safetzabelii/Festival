export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  isAdmin: boolean;
  goingTo: string[];
  liked: string[];
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    website?: string;
  };
} 