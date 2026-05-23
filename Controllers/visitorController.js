// controllers/visitorController.js
const asyncHandler = require("express-async-handler");
const Visitor = require("../Models/visitorModel");







// A Créer session
// module.exports.createSession = asyncHandler(async (req, res) => {
//   const { visitor_id, session_id, session_start } = req.body;

//   let visitor = await Visitor.findOne({ visitor_id });
//   if (!visitor) {
//     visitor = await Visitor.create({ visitor_id, sessions: [] });
//   }

//   visitor.sessions.push({ session_id, session_start, page_views: [] });
//   await visitor.save();

//   res.status(201).json({ message: "Session créée", session_id });
// });


module.exports.createSession = asyncHandler(async (req, res) => {
  const { visitor_id, session_id, session_start } = req.body;

  let visitor = await Visitor.findOne({ visitor_id });

  if (!visitor) {
    // Nouveau visitor
    visitor = await Visitor.create({
      visitor_id,
      sessions: [{ session_id, session_start, page_views: [] }],
    });
  } else {
    // Vérifie si la session existe déjà
    const existingSession = visitor.sessions.find(s => s.session_id === session_id);

    if (!existingSession) {
      visitor.sessions.push({ session_id, session_start, page_views: [] });
    }
    // Sinon, ne rien faire pour éviter le doublon
  }

  await visitor.save();

  res.status(201).json({ message: "Session créée", session_id });
})

// -----------------------------------------------------------------------------------



//   B Ajouter une page visitée
// module.exports.addPage = asyncHandler(async (req, res) => {
//   try {
//     const { visitor_id, session_id, page, enteredAt, duration } = req.body
//     const lastPage = session.page_views[session.page_views.length - 1];
//     if (lastPage?.page === page) {
//       return res.status(200).json({ message: "Page déjà enregistrée" });
//     }
//     const visitor = await Visitor.findOne({ visitor_id })

//     if (!visitor) {
//       return res.status(404).json({ message: "Visitor not found" })
//     }

//     const session = visitor.sessions.find(
//       s => s.session_id === session_id
//     )

//     if (!session) {
//       // ✅ PAS DE CRASH
//       return res.status(200).json({
//         message: "Session not ready yet, page ignored",
//       })
//     }

//     session.page_views.push({
//       page,
//       enteredAt,
//       duration,
//     })

//     await visitor.save()

//     res.status(200).json({ success: true })
//   } catch (err) {
//     res.status(500).json({ error: "Internal server error" })
//   }









// });




module.exports.addPage = asyncHandler(async (req, res) => {
  try {
    const { visitor_id, session_id, page, enteredAt, duration } = req.body;

    // 1️⃣ Cherche le visitor
    const visitor = await Visitor.findOne({ visitor_id });
    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }


    // 2️⃣ Cherche la session correspondante
    const session = visitor.sessions.find(s => s.session_id === session_id);
    if (!session) {
      return res.status(200).json({
        message: "Session not ready yet, page ignored",
      });
    }
  


    // 3️⃣ Vérifie le dernier page view pour éviter les doublons
    const lastPage = session.page_views[session.page_views.length - 1];
    if (lastPage?.page === page) {
      return res.status(200).json({ message: "Page déjà enregistrée" });
    }


    // 4️⃣ Ajoute la nouvelle page
    session.page_views.push({
      page,
      enteredAt,
      duration,
    });

    await visitor.save();
 
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
})




// ------------------------------------------------------------------------------------



// C Clôturer une session
module.exports.endSession = asyncHandler(async (req, res) => {
  const { visitor_id, session_id, session_end } = req.body;

  const visitor = await Visitor.findOne({ visitor_id });
  if (!visitor) return res.status(404).json({ message: "Visitor not found" });

  const session = visitor.sessions.find(s => s.session_id === session_id);
  if (!session) return res.status(404).json({ message: "Session not found" });

  session.session_end = session_end;
  await visitor.save();

  res.status(200).json({ message: "Session ended" });
});

// ---------------------------------------------------------------------------------------------





// D Récupérer toutes les visiteurs
module.exports.getVisitorSessions = asyncHandler(async (req, res) => {
  const visitors = await Visitor.find({});
  if (!visitors) return res.status(404).json({ message: "No Visitors in DB !" });

  res.status(200).json(visitors);
});
// ------------------------------------------------------------------------------------------------









// D Récupérer toutes les visiteurs
module.exports.deleteAllVisitor = asyncHandler(async (req, res) => {
  const visitors = await Visitor.deleteMany({});
  if (!visitors) return res.status(404).json({ message: "No Visitors in DB !" });

  res.status(200).json(visitors);
});
// ------------------------------------------------------------------------------------------------

