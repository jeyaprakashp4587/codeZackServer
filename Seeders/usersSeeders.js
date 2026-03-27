import mongoose from "mongoose";
import User from "../models/User.js";
import { DB2 } from "../Database/DB.js";

// Tamil names
const maleNames = [
  "Arun",
  "Karthik",
  "Vignesh",
  "Sathish",
  "Praveen",
  "Dinesh",
  "Harish",
  "Gokul",
  "Ajith",
  "Surya",
  "Ramesh",
  "Suresh",
  "Manikandan",
  "Naveen",
  "Lokesh",
];

const femaleNames = [
  "Anjali",
  "Divya",
  "Keerthana",
  "Nivetha",
  "Priya",
  "Swathi",
  "Harini",
  "Janani",
  "Gayathri",
  "Pavithra",
  "Meena",
  "Revathi",
  "Deepa",
  "Lakshmi",
  "Kavya",
];

const lastNames = [
  "Kumar",
  "Raj",
  "Prasad",
  "Selvan",
  "Mani",
  "Babu",
  "Krishnan",
  "Anand",
  "Ravi",
  "Murugan",
];

// More colleges → more realism
const colleges = [
  "Anna University",
  "PSG College of Technology",
  "SRM Institute of Science and Technology",
  "VIT Chennai",
  "Sastra University",
  "Kumaraguru College of Technology",
  "Thiagarajar College of Engineering",
  "Coimbatore Institute of Technology",
  "St Joseph's College of Engineering",
  "Velammal Engineering College",
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 🔥 guaranteed unique email
function uniqueEmail(name, index) {
  return `${name.toLowerCase()}${Date.now()}${index}@gmail.com`;
}

async function seedUsers() {
  try {
    await DB2;
    console.log("DB connected");

    const users = [];

    for (let i = 0; i < 50; i++) {
      const isMale = Math.random() > 0.5;

      const firstName = isMale
        ? randomItem(maleNames)
        : randomItem(femaleNames);

      const lastName = randomItem(lastNames);

      users.push({
        firstName,
        LastName: lastName,
        Email: uniqueEmail(firstName, i),
        Password: "123456",
        Gender: isMale ? "Male" : "Female",
        DateOfBirth: "2000-01-01",
        Degreename: "B.E Computer Science",
        InstitudeName: randomItem(colleges),
        State: "Tamil Nadu",
        District: randomItem([
          "Chennai",
          "Madurai",
          "Coimbatore",
          "Trichy",
          "Salem",
        ]),
        Nationality: "Indian",
        Bio: "Engineering student",
        PostLength: 0,
        Posts: [],
        Connections: [],
        ConnectionsPost: [],
        Notifications: [],
      });
    }

    const inserted = await User.insertMany(users, { ordered: false });

    console.log(`✅ ${inserted.length} users inserted`);
    process.exit();
  } catch (err) {
    console.error("❌ Seeder error:", err);
    process.exit(1);
  }
}

seedUsers();
