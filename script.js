const msg_lambdaUrl = "https://skzqcyljniai3lyr2hdx6kaaga0btnmh.lambda-url.eu-west-1.on.aws/"; // Replace with your actual messaging Lambda URL
//const msg_lambdaUrl = "https://zqnsus7wen4dhahfw3vq5kt6vu0lztaq.lambda-url.eu-west-1.on.aws/"; // Original v1 gcOpenMessaing Lambda Function URL
const reg_lambdaUrl = "https://km26rzjhrizvzt3gqqa7beqzv40dztid.lambda-url.eu-west-1.on.aws"; // Replace with your actual register Lambda URL
const sin_lambdaUrl = "https://kcho7b5kbusvoggsi2hraazzmi0rjzzx.lambda-url.eu-west-1.on.aws"; // Replace with your actual signin Lambda URL

// Open and close modals

const chatWidget = document.getElementById("chat-widget");
const chatLauncher = document.getElementById("chat-launcher");
const closeChat = document.getElementById("close-chat");
const userMessageInput = document.getElementById("user-message");
const messagingToggle = document.getElementById("messaging-toggle");

// Generate sessionId and userId
let sessionId = localStorage.getItem("sessionId") || Math.floor(10000000 + Math.random() * 90000000).toString();
let userId = localStorage.getItem("userId") || `Guest_${sessionId}`;
localStorage.setItem("sessionId", sessionId);
localStorage.setItem("userId", userId);

let messageSentInSession = false; // Track if a message has been sent in the current session
let pollingInterval;

console.log("sessionId: ", sessionId);
console.log("userId: ", userId);
console.log("messageSentInSession: ", messageSentInSession);

function startNewSession() {
    console.log("Starting a new session.");
    sessionId = localStorage.getItem("sessionId") || Math.floor(10000000 + Math.random() * 90000000).toString();
    userId = `Guest_${sessionId}`;
    localStorage.setItem("sessionId", sessionId);
    localStorage.setItem("userId", userId);
    messageSentInSession = false; // Reset the flag for the new session
}

function endSession() {
    console.log("Clearing existing session data from localStorage");
    sessionId = null;
    userId = null;
    localStorage.removeItem("sessionId");
    localStorage.removeItem("userId");
    messageSentInSession = false;
    console.log("sessionId: ", sessionId);
    console.log("userId: ", userId);
    console.log("messageSentInSession: ", messageSentInSession);
    console.log("Reloading page for new session");
    location.reload(); 
}

function openChat() {
    chatWidget.style.display = "flex";
    chatLauncher.style.display = "none";
}

closeChat.addEventListener("click", () => {
    chatWidget.style.display = "none";
    chatLauncher.style.display = "flex";
    stopPolling(); // Stop polling when the chat widget is closed
});

messagingToggle.addEventListener("change", () => {
    chatLauncher.style.display = messagingToggle.checked ? "flex" : "none";
     if (!messagingToggle.checked) {
        stopPolling();
    } else if (messageSentInSession) {
        startPolling();
    }
});

chatLauncher.addEventListener("click", openChat);

async function sendMessage() {
    const message = userMessageInput.value.trim();
    if (!message) {
        alert("Please enter a message.");
        return;
    }

    // Display the user's message in the chat widget
    displayMessage(message, "user");
    userMessageInput.value = "";

    try {
        const response = await fetch(msg_lambdaUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: sessionId, message: message, user: userId }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // If the POST was successful, start polling for new messages
        messageSentInSession = true;
        if (messagingToggle.checked) {
            startPolling();
        }
    } catch (error) {
        console.error("Error:", error.message);
        displayMessage("Error sending message. Please try again.", "agent");
    }
}

document.getElementById("send-button").addEventListener("click", sendMessage);

async function pollForMessages() {
    try {
        const response = await fetch(`${msg_lambdaUrl}?sessionId=${sessionId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();
        console.log("GET response:", data);

        if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
            data.messages.forEach((message) => {
                console.log("Processing message:", message);
                if (message.message && message.nickname) {
                    //displayMessage(`${message.nickname}: ${message.message}`, "agent");
                    displayMessage(`${message.message}`, "agent");
                }
            });
        } else {
            console.log("No new messages found.");
        }
    } catch (error) {
        console.error("Error polling for messages:", error);
    }
}



function startPolling() {
    if (messagingToggle.checked && messageSentInSession) {
        pollingInterval = setInterval(pollForMessages, 5000); // Poll every 5 seconds
    }
}

function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}

//function displayMessage(text, sender) {
//    if (!text || typeof text !== "string") {
//        console.warn("Invalid or empty message text. Skipping display.");
//        return;
//    }
//
//    // Create a new div for the message
//    const messageContainer = document.createElement("div");
//    messageContainer.classList.add(
//        "message",
//        sender === "user" ? "user-message" : "agent-message"
//    );
//    messageContainer.textContent = text;
//
//    // Append the message to the chat-messages container
//    const chatMessages = document.getElementById("chat-messages");
//    chatMessages.appendChild(messageContainer);
//
//    // Scroll to the latest message
//    chatMessages.scrollTop = chatMessages.scrollHeight;
//}

function displayMessage(text, sender) {
    if (!text || typeof text !== "string") {
        console.warn("Invalid or empty message text. Skipping display.");
        return;
    }

    // Create a new div for the message
    const messageContainer = document.createElement("div");
    messageContainer.classList.add(
        "message",
        sender === "user" ? "user-message" : "agent-message"
    );

    const avatar = document.createElement("img");
    avatar.classList.add("avatar");
    avatar.src =
        sender === "user"
            ? "images/user-avatar-icon.ico" /* User Icon from images folder */
            : "images/agent-avatar-icon.ico"; /* Agent Icon from images folder */

    const messageText = document.createElement("span");
    messageText.textContent = text;

    messageContainer.appendChild(avatar);
    messageContainer.appendChild(messageText);

    const chatMessages = document.getElementById("chat-messages");
    chatMessages.appendChild(messageContainer);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

