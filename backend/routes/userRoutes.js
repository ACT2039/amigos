import express from 'express';
import { updateUserProfile, getMyProfile, updateLocation, getGroupLocations, getAllUsers, getUserById } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/me', protect, getMyProfile);
router.get('/', protect, getAllUsers);
router.get('/:id', protect, getUserById);
router.put('/profile', protect, updateUserProfile);
router.put('/location', protect, updateLocation);
router.get('/group/:groupId/locations', protect, getGroupLocations);

export default router;
