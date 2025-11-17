const express = require("express");
const cors = require("cors");
const fs = require("fs"); // Import the File System module
const path = require("path"); // Import the Path module

const app = express();
app.use(cors());
app.use(express.json());

// Define the path to our JSON database file
const DB_FILE = path.join(__dirname, "students.json");

// --- Helper Functions for JSON DB ---

/**
 * Reads all students from the students.json file.
 * @returns {Array} An array of student objects.
 */
const loadStudents = () => {
  try {
    // Check if the file exists
    if (fs.existsSync(DB_FILE)) {
      const dataBuffer = fs.readFileSync(DB_FILE);
      const dataJSON = dataBuffer.toString();
      // If the file is empty, return an empty array
      if (dataJSON === "") {
        return [];
      }
      return JSON.parse(dataJSON);
    }
    return []; // Return empty array if file doesn't exist
  } catch (e) {
    console.error("Error reading from database:", e);
    return []; // Return empty array on error
  }
};

/**
 * Saves an array of students to the students.json file.
 * @param {Array} students - The array of student objects to save.
 */
const saveStudents = (students) => {
  try {
    // Stringify with pretty-printing (null, 2)
    const dataJSON = JSON.stringify(students, null, 2);
    fs.writeFileSync(DB_FILE, dataJSON);
  } catch (e) {
    console.error("Error writing to database:", e);
  }
};

// --- API Endpoints ---

app.get("/", (req, res) => res.send("Student Info Backend Running"));

// GET endpoint: Fetches all students OR filtered students
app.get("/students", (req, res) => {
  const students = loadStudents(); // Load fresh data from file
  const { searchBy, query } = req.query;

  // If no search query, return all students
  if (!searchBy || !query) {
    return res.json({ students });
  }

  // If there is a search query, filter the results
  const lowerQuery = query.toLowerCase();

  const filteredStudents = students.filter((student) => {
    // Check if the student property exists
    if (student[searchBy]) {
      return student[searchBy].toLowerCase().includes(lowerQuery);
    }
    return false;
  });

  res.json({ students: filteredStudents });
});

// POST endpoint to add a new student
app.post("/students", (req, res) => {
  const { name, rollNo, universityId, bloodGroup, address, year, department } =
    req.body;

  // Simple backend validation for required fields
  if (!name || !rollNo || !universityId || !year || !department) {
    return res
      .status(400)
      .json({
        error:
          "Missing required fields: name, rollNo, universityId, year, department",
      });
  }

  const newStudent = {
    id: Date.now(),
    name,
    rollNo,
    universityId,
    bloodGroup,
    address: address || "",
    year,
    department,
  };

  const students = loadStudents(); // 1. Load current students from file
  students.push(newStudent); // 2. Add the new student
  saveStudents(students); // 3. Save the updated array back to file

  console.log("Added new student (and saved to students.json):", newStudent);
  res.status(201).json({ message: "Student added", student: newStudent });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  // Ensure the DB file exists on startup
  if (!fs.existsSync(DB_FILE)) {
    saveStudents([]); // Create an empty file if it doesn't exist
    console.log("Created empty students.json database file.");
  }
  console.log(`Server listening on http://localhost:${PORT}`);
});
