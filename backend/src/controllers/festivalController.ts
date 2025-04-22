import { Request, Response } from 'express';
import Festival from '../models/Festival';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const getFestivals = async (req: Request, res: Response) => {
  const { genre, city, country, isFree, startDate, endDate } = req.query;

  const filters: any = {};
  

  if (genre) filters.genre = genre;
  if (city) filters['location.city'] = city;
  if (country) filters['location.country'] = country;
  if (isFree !== undefined) filters.isFree = isFree === 'true';
  if (startDate || endDate) {
    filters.startDate = {};
    if (startDate) filters.startDate.$gte = new Date(startDate as string);
    if (endDate) filters.startDate.$lte = new Date(endDate as string);
  }

  try {
    const festivals = await Festival.find(filters).sort({ startDate: 1 });
    res.json(festivals);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get festivals' });
  }
};

export const getFestivalById = async (req: Request, res: Response) => {
  try {
    const festival = await Festival.findById(req.params.id);
    if (!festival) return res.status(404).json({ message: 'Not found' });
    res.json(festival);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get festival' });
  }
};

export const createFestival = async (req: any, res: Response) => {
  try {
    console.log('Received request to create festival');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('User:', req.user);

    const festivalData = JSON.parse(req.body.festivalData);
    const image = req.file;

    console.log('Parsed festival data:', festivalData);
    console.log('Image file:', image);

    let imageUrl;
    if (image) {
      // Create images directory if it doesn't exist
      const publicDir = join(process.cwd(), 'public');
      const imageDir = join(publicDir, 'images', 'festivals');

      console.log('Current working directory:', process.cwd());
      console.log('Public directory absolute path:', publicDir);
      console.log('Image directory absolute path:', imageDir);

      // Ensure directories exist
      if (!existsSync(publicDir)) {
        console.log('Creating public directory...');
        await mkdir(publicDir, { recursive: true });
      }

      if (!existsSync(imageDir)) {
        console.log('Creating festivals directory...');
        await mkdir(imageDir, { recursive: true });
      }

      // Generate image path
      const imageName = `${festivalData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.jpg`;
      const imagePath = join(imageDir, imageName);
      imageUrl = `images/festivals/${imageName}`;

      console.log('Generated image name:', imageName);
      console.log('Full image path:', imagePath);
      console.log('Image URL to be saved:', imageUrl);

      try {
        // Save image to public directory
        await writeFile(imagePath, image.buffer);
        console.log('Image saved successfully at:', imagePath);
        // Verify file exists after saving
        if (existsSync(imagePath)) {
          console.log('Verified: Image file exists at path');
        } else {
          console.error('Warning: Image file does not exist after saving');
        }
      } catch (error) {
        console.error('Error saving image:', error);
        throw error;
      }

      // Add image URL to festival data
      festivalData.imageUrl = imageUrl;
    }

    // Check if the user is an admin
    const isAdmin = req.user.isAdmin;
    console.log('Is user admin:', isAdmin);

    const festival = new Festival({
      ...festivalData,
      createdBy: req.user._id,
      approved: isAdmin // Automatically approve only if created by admin
    });

    const saved = await festival.save();
    console.log('Festival saved successfully:', {
      id: saved._id,
      name: saved.name,
      imageUrl: saved.get('imageUrl'),
      approved: saved.approved,
      createdBy: saved.createdBy
    });
    
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error creating festival:', err);
    res.status(500).json({ message: 'Failed to create festival' });
  }
};

export const updateFestival = async (req: any, res: Response) => {
  try {
    console.log('Received request to update festival');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

    const festival = await Festival.findById(req.params.id);
    if (!festival) return res.status(404).json({ message: 'Festival not found' });

    if (festival.createdBy.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let festivalData;
    try {
      festivalData = JSON.parse(req.body.festivalData);
      console.log('Parsed festival data:', festivalData);
    } catch (error) {
      console.error('Error parsing festivalData:', error);
      return res.status(400).json({ message: 'Invalid festival data format' });
    }

    let imageUrl = festival.imageUrl; // Keep existing image URL by default
    if (req.file) {
      try {
        // Create images directory if it doesn't exist
        const publicDir = join(process.cwd(), 'public');
        const imageDir = join(publicDir, 'images', 'festivals');

        // Ensure directories exist
        if (!existsSync(publicDir)) {
          await mkdir(publicDir, { recursive: true });
        }
        if (!existsSync(imageDir)) {
          await mkdir(imageDir, { recursive: true });
        }

        // Generate image path
        const imageName = `${festivalData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.jpg`;
        const imagePath = join(imageDir, imageName);
        imageUrl = `images/festivals/${imageName}`;

        console.log('Saving new image:', {
          imageName,
          imagePath,
          imageUrl
        });

        // Save image to public directory
        await writeFile(imagePath, req.file.buffer);
        console.log('New image saved successfully');
      } catch (error) {
        console.error('Error saving image:', error);
        return res.status(500).json({ message: 'Failed to save image' });
      }
    } else {
      console.log('No new image provided, keeping existing image URL:', imageUrl);
    }

    // Update festival data
    const updatedData = {
      ...festivalData,
      imageUrl
    };

    console.log('Updating festival with data:', updatedData);

    // Use findByIdAndUpdate to get the new document
    const updated = await Festival.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Festival not found after update' });
    }

    console.log('Festival updated successfully:', updated);
    res.json(updated);
  } catch (err) {
    console.error('Error updating festival:', err);
    res.status(500).json({ message: 'Failed to update festival', error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const deleteFestival = async (req: any, res: Response) => {
  try {
    const festival = await Festival.findById(req.params.id);
    if (!festival) return res.status(404).json({ message: 'Not found' });

    if (festival.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await festival.deleteOne();
    res.json({ message: 'Festival deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete festival' });
  }
};

// GET /api/festivals/pending
export const getUnapprovedFestivals = async (req: Request, res: Response) => {
    try {
      const festivals = await Festival.find({ approved: false }).sort({ createdAt: -1 });
      res.json(festivals);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch pending festivals' });
    }
  };
  
  export const approveFestival = async (req: Request, res: Response) => {
    try {
      const festival = await Festival.findById(req.params.id);
      if (!festival) return res.status(404).json({ message: 'Festival not found' });
  
      festival.approved = true;
      const approvedFestival = await festival.save();
  
      res.json(approvedFestival);
    } catch (err) {
      res.status(500).json({ message: 'Failed to approve festival' });
    }
  };
  
  
