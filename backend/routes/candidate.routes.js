const express = require("express");
const router = express.Router();
const Candidate = require("../models/candidate.model");
const User = require("../models/user.model");
const { jwtAuthMiddleware, generateToken } = require("../jwt");

const checkAdminRole = async (userID) => {
  try {
    const user = await User.findById(userID);
    if (user.role === "admin") {
      return true;
    }
  } catch (err) {
    console.log(err);
    return false;
  }
};

// => add candidate route

router.post('/', jwtAuthMiddleware, async (req, res) =>{
    try{
        if(!(await checkAdminRole(req.user.id)))
            return res.status(403).json({message: 'You are not authorized to add candidate'});

        const data = req.body // Assuming the request body contains the candidate data

        // Create a new User document using the Mongoose model
        const newCandidate = new Candidate(data);

        // Save the new user to the database
        const response = await newCandidate.save();

        console.log('data saved');

        res.status(200).json({ response: response });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
      }
})


router.put("/:candidateID", jwtAuthMiddleware, async (req, res) => {
  try {
    
    if(!(await checkAdminRole(req.user.id)))
        return res.status(403).json({message: 'You are not authorized to update candidate'});

    const candidateID = req.user.candidateID;
    const updatedCandidateData = req.body;

    const response = await Candidate.findByIdAndUpdate(candidateID, updatedCandidateData, {
        new: true, // Return the updated document
        runValidators: true, // Run Mongoose validation
    })

    if (!response) {
        return res.status(404).json({ error: 'Candidate not found' });
    }

    console.log("data updated");
    res.status(200).json({ message: "Candidate data updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:candidateID", jwtAuthMiddleware, async (req, res) => {
    try {
      
      if(!(await checkAdminRole(req.user.id)))
          return res.status(403).json({message: 'You are not authorized to update candidate'});
  
      const candidateID = req.user.candidateID;
  
      const response = await Candidate.findByIdAndDelete(candidateID);
  
      if (!response) {
          return res.status(404).json({ error: 'Candidate not found' });
      }
  
      console.log("data deleted");
      res.status(200).json({ message: "Candidate data deleted" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: error.message });
    }
});

// start voting route

router.post("/vote/:candidateID", jwtAuthMiddleware, async (req, res) => {
    
    try {
        const candidateID = req.params.candidateID;
        const userID = req.user.id;

        const candidate = await Candidate.findById(candidateID);
        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        const user = await User.findById(userID);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.isVoted) {
            return res.status(400).json({ error: 'User has already voted' });
        }

        if(user.role === "admin") {
            return res.status(403).json({message: 'Admin cannot vote'});
        }

        // Update the candidate's vote count
        candidate.voteCount += 1;
        candidate.votes.push({
            user: userID,
            votedAt: Date.now(),
        });
        await candidate.save();

        // Update the user's isVoted status

        user.isVoted = true;
        await user.save();

        res.status(200).json({ message: 'Vote casted successfully' });

    
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }

})

// vote count route

router.get("/vote/count", async (req, res) => {
    try {
        
        const candidates = await Candidate.find().sort({ voteCount: 'desc' });


        const voteCountRecords = candidates.map(candidate => {
            return {
                name: candidate.name,
                party: candidate.party,
                voteCount: candidate.voteCount,
            }
        });

        res.status(200).json({ voteCountRecords });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

// get all candidates route
router.get("/candidates", async (req, res) => {
    try {
        const candidates = await Candidate.find();
        res.status(200).json(candidates);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;
