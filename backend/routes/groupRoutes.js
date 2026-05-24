import express from 'express';
import { createGroup, renameGroup, leaveGroup, deleteGroup, searchGroups, generateInviteToken, getInviteDetails, joinGroup, joinGroupByCode, getMyGroups, regenerateGroupCode } from '../controllers/groupController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createGroup).get(protect, getMyGroups);
router.get('/search', protect, searchGroups);
router.post('/join-code', protect, joinGroupByCode);
router.put('/:id/rename', protect, renameGroup);
router.put('/:id/code', protect, regenerateGroupCode);
router.post('/:id/leave', protect, leaveGroup);
router.delete('/:id', protect, deleteGroup);
router.post('/:id/invite', protect, generateInviteToken);
router.get('/invite/:token', getInviteDetails);
router.post('/join/:token', protect, joinGroup);

export default router;
