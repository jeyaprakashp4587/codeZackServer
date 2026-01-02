import admin from "firebase-admin";
import "dotenv/config";
// Custom function to initialize Firebase Admin SDK fgr
const initializeFirebaseAdmin = () => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: "loanbuddy-aa9c3",
        privateKey: "nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDOswJICtioMSpg\n0ly2AO8T+XDjMSBHQKv/J3SiEJ6DOaS+yn4UZS0cuLdeabMdLnNlkIhmJdCXrTkB\nQryG8jpIQqCcU1EDWsjK55XQaCEdeQL2i5MOcTciZgt+BfYTwlaRvb5zc9+7HGQH\nZeTPudSOtwCjW9JxXJa7wKNLyYy8s11aZFwKq1fHaJrhOgtJdoqvW35AW5piRP3K\njGq0OfXKdiHP0O68MWlXX0qqg9VMWVOta64s5BGo4ewuSxf4G4DrEypafmUS4W9Z\nZquTzvhsjyVYF1ALUX7/72JzLTm6ew9q4wbDNR79zW6qnHEyzhUdAi9mZZsYaYuQ\nTd3P86sjAgMBAAECggEAP/COBx0b0kOLOXI5ba+yRTqHWjBLLN9rlT1uTefYMP22\n4bIf+E0n/FeDmbgWyTMiTUu9dePCt/jExogPa6sorku2BUWcrO37aRDkfhiIDebu\nLLgWYIRTKtfoPC655XjbcLACZxJ0JhxtMQCrHDr+7rrbfq0b1yduFVxM51fMql4+\nr4X5uUOhk4AdNsJHyAssSRU3S++X7TaxdrqE/gY6VhM58QDSBy+FTTW8ZHGLxEmM\nPaw7kE2s7+nUhxJpoCA0B26OMU+P3DyDOkAOdaZOnBE3xlS6uJz5eV9mucrtG9kQ\nmxABzctw0C9ernAUKpMnxMF5tiHSB+xQldB+/ofTqQKBgQD/Nys3Q/S9eJdqSmBi\niCAa1wpV8iFhOq606+opXgTEA8Dz4X4yssKXI3uJk8z9KLgFAvFRICgN9uq8tUwK\nnz0o72m5CPBG5hjE8ws/kdTq7jOX/e0gD7nUuz1NJPrQ2P8OxFwBLISGYeyR6NRu\nRzNAHudrkgIODFdpQ7Q1u694jQKBgQDPVamKAkk2K0lyRGXuyLM7s8dpEh8M4nSf\nmoIIdHxvW3q51GBb/bHkl4ip3T8k8UraEnxeR82wqTrtV8yLoRnK6WhW3YkaQBL8\na1do9J6jVA6m4Nt9yjjkxI1PcM0PwgBiic3wt7h7EKGTBtHQwU+RJTwIak9etPx/\nFd78E+1+bwKBgQC8Vg8LMpfqNpKueoKUU9Y1WFmlQRCG+tIwayQbMOmdaRO8JbyG\nV0qoVCP3S93rOGBMOnawomVMoNlrNvMNp6NvkPXY+ZKvD2BZ/u1fFRQl5nCmilmx\n3kkJhr9fLZn2Axx93kPzDdIihSMaLdKOKvbUK7oltNLVYSAkazUSrhV4hQKBgQDB\nXtB/ocAsYFTg2MAE43Sekv7BlSAWgUJp9M2gGxxPM4+Tr2qrgUIfw+C3JF0XFGBO\nYP1TZT6GrF8EK2XfOEJ5CBXDJl0PeYD7oRVmEve9ttDvfTnY6PkFC/gLhlYKg1Ke\nlI3ZG1BYnttC6BJZ02FlKsgBxTz/RGdWE8zjZ6aRywKBgQDRb8bNba1yN2MsGWCo\nspd4ziE20epH3QHjwXNe//K/om4B5fH8fFSa5A1uy+dmA7l9UibcEeQAs2wy7Pkk\nIE1PAZcTStchtoE7DajfeeoS47Aa6J8PXqr6On+sTDRoWDKF0J4npuS/OjWJSi50\nxDqiHIOsub/H8DQhWq31tiYzoQ==",
        clientEmail: "firebase-adminsdk-w6b3p@loanbuddy-aa9c3.iam.gserviceaccount.com",
      }),
    });
    console.log("Firebase Admin SDK initialized");
  } else {
    console.log("Firebase Admin SDK already initialized");
  }

  return admin;
};

export default initializeFirebaseAdmin;

