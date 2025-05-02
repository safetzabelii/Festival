"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveFestival = exports.getUnapprovedFestivals = exports.deleteFestival = exports.updateFestival = exports.createFestival = exports.getFestivalById = exports.getFestivals = void 0;
const Festival_1 = __importDefault(require("../models/Festival"));
const promises_1 = require("fs/promises");
const path_1 = require("path");
const fs_1 = require("fs");
const getFestivals = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { genre, city, country, isFree, startDate, endDate } = req.query;
    const filters = {};
    if (genre)
        filters.genre = genre;
    if (city)
        filters['location.city'] = city;
    if (country)
        filters['location.country'] = country;
    if (isFree !== undefined)
        filters.isFree = isFree === 'true';
    if (startDate || endDate) {
        filters.startDate = {};
        if (startDate)
            filters.startDate.$gte = new Date(startDate);
        if (endDate)
            filters.startDate.$lte = new Date(endDate);
    }
    try {
        const festivals = yield Festival_1.default.find(filters).sort({ startDate: 1 });
        res.json(festivals);
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to get festivals' });
    }
});
exports.getFestivals = getFestivals;
const getFestivalById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const festival = yield Festival_1.default.findById(req.params.id);
        if (!festival)
            return res.status(404).json({ message: 'Not found' });
        res.json(festival);
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to get festival' });
    }
});
exports.getFestivalById = getFestivalById;
const createFestival = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            const publicDir = (0, path_1.join)(process.cwd(), 'public');
            const imageDir = (0, path_1.join)(publicDir, 'images', 'festivals');
            console.log('Current working directory:', process.cwd());
            console.log('Public directory absolute path:', publicDir);
            console.log('Image directory absolute path:', imageDir);
            // Ensure directories exist
            if (!(0, fs_1.existsSync)(publicDir)) {
                console.log('Creating public directory...');
                yield (0, promises_1.mkdir)(publicDir, { recursive: true });
            }
            if (!(0, fs_1.existsSync)(imageDir)) {
                console.log('Creating festivals directory...');
                yield (0, promises_1.mkdir)(imageDir, { recursive: true });
            }
            // Generate image path
            const imageName = `${festivalData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.jpg`;
            const imagePath = (0, path_1.join)(imageDir, imageName);
            imageUrl = `images/festivals/${imageName}`;
            console.log('Generated image name:', imageName);
            console.log('Full image path:', imagePath);
            console.log('Image URL to be saved:', imageUrl);
            try {
                // Save image to public directory
                yield (0, promises_1.writeFile)(imagePath, image.buffer);
                console.log('Image saved successfully at:', imagePath);
                // Verify file exists after saving
                if ((0, fs_1.existsSync)(imagePath)) {
                    console.log('Verified: Image file exists at path');
                }
                else {
                    console.error('Warning: Image file does not exist after saving');
                }
            }
            catch (error) {
                console.error('Error saving image:', error);
                throw error;
            }
            // Add image URL to festival data
            festivalData.imageUrl = imageUrl;
        }
        // Check if the user is an admin
        const isAdmin = req.user.isAdmin;
        console.log('Is user admin:', isAdmin);
        const festival = new Festival_1.default(Object.assign(Object.assign({}, festivalData), { createdBy: req.user._id, approved: isAdmin // Automatically approve only if created by admin
         }));
        const saved = yield festival.save();
        console.log('Festival saved successfully:', {
            id: saved._id,
            name: saved.name,
            imageUrl: saved.get('imageUrl'),
            approved: saved.approved,
            createdBy: saved.createdBy
        });
        res.status(201).json(saved);
    }
    catch (err) {
        console.error('Error creating festival:', err);
        res.status(500).json({ message: 'Failed to create festival' });
    }
});
exports.createFestival = createFestival;
const updateFestival = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Received request to update festival');
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);
        const festival = yield Festival_1.default.findById(req.params.id);
        if (!festival)
            return res.status(404).json({ message: 'Festival not found' });
        if (festival.createdBy.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        let festivalData;
        try {
            festivalData = JSON.parse(req.body.festivalData);
            console.log('Parsed festival data:', festivalData);
        }
        catch (error) {
            console.error('Error parsing festivalData:', error);
            return res.status(400).json({ message: 'Invalid festival data format' });
        }
        let imageUrl = festival.imageUrl; // Keep existing image URL by default
        if (req.file) {
            try {
                // Create images directory if it doesn't exist
                const publicDir = (0, path_1.join)(process.cwd(), 'public');
                const imageDir = (0, path_1.join)(publicDir, 'images', 'festivals');
                // Ensure directories exist
                if (!(0, fs_1.existsSync)(publicDir)) {
                    yield (0, promises_1.mkdir)(publicDir, { recursive: true });
                }
                if (!(0, fs_1.existsSync)(imageDir)) {
                    yield (0, promises_1.mkdir)(imageDir, { recursive: true });
                }
                // Generate image path
                const imageName = `${festivalData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.jpg`;
                const imagePath = (0, path_1.join)(imageDir, imageName);
                imageUrl = `images/festivals/${imageName}`;
                console.log('Saving new image:', {
                    imageName,
                    imagePath,
                    imageUrl
                });
                // Save image to public directory
                yield (0, promises_1.writeFile)(imagePath, req.file.buffer);
                console.log('New image saved successfully');
            }
            catch (error) {
                console.error('Error saving image:', error);
                return res.status(500).json({ message: 'Failed to save image' });
            }
        }
        else {
            console.log('No new image provided, keeping existing image URL:', imageUrl);
        }
        // Update festival data
        const updatedData = Object.assign(Object.assign({}, festivalData), { imageUrl });
        console.log('Updating festival with data:', updatedData);
        // Use findByIdAndUpdate to get the new document
        const updated = yield Festival_1.default.findByIdAndUpdate(req.params.id, updatedData, { new: true, runValidators: true });
        if (!updated) {
            return res.status(404).json({ message: 'Festival not found after update' });
        }
        console.log('Festival updated successfully:', updated);
        res.json(updated);
    }
    catch (err) {
        console.error('Error updating festival:', err);
        res.status(500).json({ message: 'Failed to update festival', error: err instanceof Error ? err.message : 'Unknown error' });
    }
});
exports.updateFestival = updateFestival;
const deleteFestival = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const festival = yield Festival_1.default.findById(req.params.id);
        if (!festival)
            return res.status(404).json({ message: 'Not found' });
        if (festival.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        yield festival.deleteOne();
        res.json({ message: 'Festival deleted' });
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to delete festival' });
    }
});
exports.deleteFestival = deleteFestival;
// GET /api/festivals/pending
const getUnapprovedFestivals = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const festivals = yield Festival_1.default.find({ approved: false }).sort({ createdAt: -1 });
        res.json(festivals);
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to fetch pending festivals' });
    }
});
exports.getUnapprovedFestivals = getUnapprovedFestivals;
const approveFestival = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const festival = yield Festival_1.default.findById(req.params.id);
        if (!festival)
            return res.status(404).json({ message: 'Festival not found' });
        festival.approved = true;
        const approvedFestival = yield festival.save();
        res.json(approvedFestival);
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to approve festival' });
    }
});
exports.approveFestival = approveFestival;
