import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const festivalData = JSON.parse(formData.get('festivalData') as string);
    const image = formData.get('image') as Blob;

    if (!image) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Create images directory if it doesn't exist
    const publicDir = join(process.cwd(), 'public');
    const imageDir = join(publicDir, 'images', 'festivals');

    if (!existsSync(imageDir)) {
      await mkdir(imageDir, { recursive: true });
    }

    // Convert image to buffer
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate image path
    const imageName = `${festivalData.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    const imagePath = join(imageDir, imageName);

    // Save image to public directory
    await writeFile(imagePath, buffer);

    // Add image URL to festival data
    const festival = {
      ...festivalData,
      imageUrl: `/images/festivals/${imageName}`
    };

    // Here you would typically save the festival data to your database
    // For now, we'll just return the created festival
    return NextResponse.json(festival);
  } catch (error) {
    console.error('Error handling festival upload:', error);
    return NextResponse.json(
      { error: 'Error processing festival upload' },
      { status: 500 }
    );
  }
} 