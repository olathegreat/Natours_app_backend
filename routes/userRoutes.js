const express = require('express')
const userController = require("./../controllers/userController")
const authController = require("./../controllers/authController")

const router = express.Router();

router.post('/signup', authController.signup);  
router.post('/login', authController.login); 
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword); 
router.patch('/updateMyPassword',authController.protect, authController.updatePassword); 
router.patch('/updateMe',authController.protect, userController.updateMe);

router.delete('/deleteMe',authController.protect, userController.deleteMe); 

router
    .route('/')
    .get(userController.getAllUsers)
    .post(userController.createUsers);


router
  .route('/:id')
  .get(userController.getUserById)
  .put(userController.updateUserById)
  .delete(userController.deleteUserById);

router.get('/me', authController.protect,userController.getMe, userController.getUserById);


module.exports = router;