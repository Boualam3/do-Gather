import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
  acceptUserApplication,
  applyToPost,
  createNewPost,
  deletePost,
  displayUsersBasedOnSkills,
  displayUsersWhoApplied,
  displayUsersWorkingOnPost,
  getAllPosts,
  getPostById,
  inviteUser,
  rejectUserApplication,
  updatePost,
} from '../controllers/post.controller.js';
import { validateData } from '../middleware/validationMiddleware.js';
import {
  postCreateSchema,
  postUpdateSchema,
} from '../schemas/validationSchemas.js';

const router = express.Router();

router.get('/', verifyToken, getAllPosts);
router.get('/:id/applicants', verifyToken, displayUsersWhoApplied);
router.get('/:id/accepted', verifyToken, displayUsersWorkingOnPost);
router.get('/:id/recommended', verifyToken, displayUsersBasedOnSkills);
router.get('/:id', verifyToken, getPostById);

router.post(
  '/create',
  validateData(postCreateSchema),
  verifyToken,
  createNewPost
);
router.post('/:id/invite/:username', verifyToken, inviteUser);
router.post('/:id/apply', verifyToken, applyToPost);
router.post('/:id/accept/:userID', verifyToken, acceptUserApplication);
router.post('/:id/reject/:userID', verifyToken, rejectUserApplication);

router.put('/:id', validateData(postUpdateSchema), verifyToken, updatePost);

router.delete('/:id', verifyToken, deletePost);

export default router;
