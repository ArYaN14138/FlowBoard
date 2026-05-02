import { io } from "socket.io-client";
import { API_URL } from "./client";

const socketUrl = API_URL.replace(/\/api$/, "");

export const createSocket = () =>
  io(socketUrl, {
    autoConnect: false,
    auth: {
      token: localStorage.getItem("token")
    }
  });
