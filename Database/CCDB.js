import mongoose from "mongoose";
//
const DbConfig =
  "mongodb+srv://jeyaprakashp431:KOuDbfkcGShd3way@codecampusdata.btln4ke.mongodb.net/CodeCampusDB?retryWrites=true&w=majority&appName=CodeCampusData";
//
const DB1 = mongoose.createConnection(DbConfig);
export { DB1 };
// 9frjbb
