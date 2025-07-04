const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const { jwtAuthMiddleware, generateToken } = require('../jwt');

// => signup route

router.post('/signup', async (req, res) => {
    try {
        const data = req.body

        const newUser = await User(data);

        const response = await newUser.save();
        console.log('data saved')

        const payload = {
            id: response._id,
        }
        console.log(JSON.stringify(payload))
        const token = generateToken(payload);
        console.log('token is:',token)

        res.status(200).json({response: response, token: token});

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message });
    }
})

// => login route
router.post('/login', async (req, res) => {
    try {

        const {aadharCard, password} = req.body;

        const user = await User.findOne({aadharCard: aadharCard});

        if( !user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid aadhar or password' });
        }

        const payload = {
            id: user._id,
        }
        const token = generateToken(payload);

        res.json({token})

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message });
    }
})

// => profile route
router.get('/profile', jwtAuthMiddleware, async (req, res) => {
    try {
        const userData = req.user;
        const userId = userData.id;
        const user = await User.findById(userId);
        res.status(200).json({user});

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message });
    }
})

// => profile/password route
router.put('/profile/password', jwtAuthMiddleware, async (req, res) => {
    try {

        const userId = req.user.id;
        const {currPassword, newPassword} = req.body;

        const user = await User.findById(userId);

        if(!(await user.comparePassword(currPassword))) {
            return res.status(401).json({ error: 'Invalid aadhar or password' });
        }

        user.password = newPassword;
        await user.save();

        console.log('password updated');
        res.status(200).json({message: 'password updated'});
        
    } catch (error) {
        console.log(error);     
        res.status(500).json({ error: error.message });
    }
})


module.exports = router;

