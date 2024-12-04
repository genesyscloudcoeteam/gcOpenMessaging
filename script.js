const msg_lambdaUrl = "https://skzqcyljniai3lyr2hdx6kaaga0btnmh.lambda-url.eu-west-1.on.aws/"; // Replace with your actual messaging Lambda URL
//const msg_lambdaUrl = "https://zqnsus7wen4dhahfw3vq5kt6vu0lztaq.lambda-url.eu-west-1.on.aws/"; // Original v1 gcOpenMessaing Lambda Function URL
const reg_lambdaUrl = "https://km26rzjhrizvzt3gqqa7beqzv40dztid.lambda-url.eu-west-1.on.aws"; // Replace with your actual register Lambda URL
const signinLambdaUrl = "https://egqvlsgf4gy7usnzp4zyd2tl7i0yrmww.lambda-url.eu-west-1.on.aws"; // Replace with your Lambda URL

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

// JavaScript to toggle the video container visibility
document.getElementById('show-hla-btn').addEventListener('click', function () {
    const videoContainer = document.getElementById('video-container');
    // Toggle the display property
    if (videoContainer.style.display === 'none' || videoContainer.style.display === '') {
        videoContainer.style.display = 'flex'; // Show the video container
    } else {
        videoContainer.style.display = 'none'; // Hide the video container
    }
});

// Open the Sign In Modal
function openSignInModal() {
    document.getElementById('signin-modal').style.display = 'flex';
}

// Close the Sign In Modal
function closeSignInModal() {
    document.getElementById('signin-modal').style.display = 'none';
    document.getElementById('signin-message').textContent = ''; // Clear any previous messages
}

// Handle Sign In Form Submission
document.getElementById('signin-form').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent the form from reloading the page

    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value.trim(); // Not used in the Lambda for now

    if (!email) {
        document.getElementById('signin-message').textContent = 'Email is required.';
        return;
    }

    const processingIndicator = document.getElementById('signin-processing');
    const messageElement = document.getElementById('signin-message');
    const submitButton = event.target.querySelector('button[type="submit"]');

    // Show processing indicator and disable submit button
    processingIndicator.style.display = 'block';
    submitButton.disabled = true;
    messageElement.textContent = ''; // Clear any previous messages

    try {
        const response = await fetch(signinLambdaUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });

        const result = await response.json();

        if (response.ok && result.result === "success") {
            // On success
            closeSignInModal();
            const signinBtn = document.getElementById('signin-btn');
            signinBtn.disabled = true;
            signinBtn.textContent = 'Signed In';
            signinBtn.style.backgroundColor = '#87ceeb'; // Change background color
            signinBtn.style.color = '#000'; // Change label/text color
            localStorage.setItem("userId", result.uuId); // Update userId in local storage
            userId = result.uuId;
            alert("Sign In Successful");
        } else {
            // On failure
            messageElement.textContent = `Error: ${result.message}`;
        }
    } catch (error) {
        console.error("Sign In Error:", error);
        messageElement.textContent = "An unexpected error occurred. Please try again.";
    } finally {
        // Hide processing indicator and re-enable submit button
        processingIndicator.style.display = 'none';
        submitButton.disabled = false;
    }
});
