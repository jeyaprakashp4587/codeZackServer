import mongoose from "mongoose";
//
const DbConfig =
  "mongodb+srv://jeyaprakashp431:1DaSbsncTW8y1oR0@cluster0.mycbcc2.mongodb.net/UserData?retryWrites=true&w=majority&appName=Cluster0";
//
const DB2 = mongoose.createConnection(DbConfig);
export { DB2 };
