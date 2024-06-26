import {
  updateSkills,
  acceptUsersApplications,
  rejectInvitation,
} from '../services/common.queries.js';
import {
  checkUsername,
  getUser,
  updateUserInfo,
  deleteUserByID,
  getInvitations,
  getPostsWhichUserJoined,
  isUserAccepted,
  getSkills,
  compareUserSkills,
  getUsers,
  getPostInvitation,
} from '../services/user.queries.js';

import { getPost } from '../services/post.queries.js';

import bcrypt from 'bcrypt';

//ADMIN ROUTE : GET ALL USERS
export const getAllUsers = async (req, res) => {
  const userID = req.userId;
  if (!userID) return res.status(400).json({ message: 'Invalid user ID' });
  try {
    const user = await getUser(userID);
    if (!user) return res.status(400).json({ message: 'User not found' });
    if (user.role !== 'ADMIN')
      return res.status(403).json({ message: 'You are not authorized!' });
    const users = await getUsers();
    return res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users!' });
  }
};

//UPDATE USER
export const updateUser = async (req, res) => {
  const { username, email, bio, role, skills, password } = req.body;
  const userId = req.params.userID;

  const userID = req.userId;

  if (!userID) return res.status(400).json({ message: 'Invalid user ID' });

  if (userId !== userID)
    return res
      .status(403)
      .json({ message: 'You are not authorized for this ID!' });

  if (role && !['VOLUNTEER', 'ORGANIZER'].includes(role)) {
    return res.status(400).json({
      message: 'Invalid role. Only volunteer or organizer roles are allowed.',
    });
  }

  try {
    const fieldsToUpdate = {};
    if (username) {
      const existingUser = await checkUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: 'Username already taken' });
      }
      fieldsToUpdate.username = username;
    }
    if (email) fieldsToUpdate.email = email;
    if (bio) fieldsToUpdate.bio = bio;
    if (role) fieldsToUpdate.role = role;
    if (password) {
      fieldsToUpdate.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
      const result = await updateUserInfo(userID, fieldsToUpdate);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
    }

    if (skills && skills.length > 0) {
      await updateSkills(userID, skills, 'users_skills', 'user_id');
    }

    const user = await getUser(userID);

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user!' });
  }
};

//DELETE USER
export const deleteUser = async (req, res) => {
  const userId = req.params.userID;

  const userID = req.userId;

  if (!userID) return res.status(400).json({ message: 'Invalid user ID' });

  if (userId !== userID)
    return res
      .status(403)
      .json({ message: 'You are not authorized for this ID!' });
  try {
    await deleteUserByID(userId);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

//DISPLAY ALL INVITATIONS
export const displayInvitations = async (req, res) => {
  const userId = req.userId;
  console.log(userId);
  try {
    const invitations = await getInvitations(userId);
    if (invitations.length === 0) {
      return res.status(404).json({ message: 'No invitations found.' });
    }
    res.status(200).json(invitations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch invitations' });
  }
};

//ACCEPT A POST INVITATION
export const acceptPost = async (req, res) => {
  const userID = req.userId;
  const postID = req.params.postId;

  try {
    const isAccepted = await isUserAccepted(postID, userID);
    if (isAccepted) {
      return res
        .status(400)
        .json({ message: 'User is already accepted for this post' });
    }
    await acceptUsersApplications(postID, userID, 'post_invitations');
    res.status(200).json({ message: 'Post accepted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to accept post invitation!' });
  }
};

//REJECT A POST INVITATION
export const rejectPostInvitation = async (req, res) => {
  const userID = req.userId;
  const postID = req.params.postId;

  try {
    const post = await getPost(postID);

    if (!post) return res.status(404).json({ message: 'Post not found' });
    const invitation = await getPostInvitation(postID, userID);
    if (!invitation) {
      return res
        .status(404)
        .json({ message: 'Invitation not found or unauthorized' });
    }
    if (invitation.status === 'rejected')
      res.status(400).json({ message: 'Invitation rejected already' });
    await rejectInvitation(postID, userID, 'post_invitations');
    res.status(200).json({ message: 'Post rejected successfully!' });
  } catch (error) {
    res
      .status(500)
      .json({ message: `Failed to reject post invitation.${error}` });
  }
};

//DISPLAY POSTS THAT USER IS WORKING ON
export const getAcceptedPosts = async (req, res) => {
  const userID = req.userId;
  try {
    const posts = await getPostsWhichUserJoined(userID);
    if (posts.length === 0) {
      return res
        .status(200)
        .json({ message: 'User was not accepted to a post!' });
    }
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch accepted posts' });
  }
};

//DISPLAY POSTS THAT USER HAS SKILLS REQUIRED
export const displayPostsBasedOnUserSkills = async (req, res) => {
  const userId = req.userId;

  try {
    const { skills } = await getSkills(userId);
    const posts = await compareUserSkills(skills);
    if (posts.length === 0) {
      return res
        .status(404)
        .json({ message: 'No posts available matching your skills.' });
    }

    res.status(200).json(posts);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Failed to fetch posts based on user skills' });
  }
};
