
"use strict";

// ---------- LANGUAGE ----------
let currentLanguage = localStorage.getItem("nelslotLanguage") || "en";

function applyLanguage() {
  document.querySelectorAll("[data-en][data-ta]").forEach(element => {
    element.textContent = element.dataset[currentLanguage];
  });

  document.documentElement.lang = currentLanguage;
  document.getElementById("languageButton").textContent =
    currentLanguage === "en" ? "தமிழ்" : "English";
}

function toggleLanguage() {
  currentLanguage = currentLanguage === "en" ? "ta" : "en";
  localStorage.setItem("nelslotLanguage", currentLanguage);
  applyLanguage();
}

// ---------- NAVIGATION ----------
function showSection(id) {
  document.querySelectorAll(".panel").forEach(section => {
    section.classList.add("hidden");
  });

  const target = document.getElementById(id);

  if (target) {
    target.classList.remove("hidden");
  }

  document.querySelectorAll(".nav-button").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.section === id
    );
  });

  if (id === "dashboard") updateDashboard();
  if (id === "queue") updateQueue();
  if (id === "prices") comparePrices();
}

// ---------- STORAGE ----------
let bookings = [];

try {
  bookings = JSON.parse(
    localStorage.getItem("nelslotBookings") || "[]"
  );

  if (!Array.isArray(bookings)) bookings = [];
} catch {
  bookings = [];
}

function saveBookings() {
  localStorage.setItem(
    "nelslotBookings",
    JSON.stringify(bookings)
  );
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function getLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const dateInput = document.getElementById("date");

if (dateInput) {
  dateInput.min = getLocalDate();
}

function makeToken() {
  return "NS360-" + Date.now().toString().slice(-7) +
    Math.floor(Math.random() * 10);
}

// ---------- BOOKING ----------
document.getElementById("bookingForm")
  .addEventListener("submit", function(event) {
    event.preventDefault();

    const name = document.getElementById("farmerName").value.trim();
    const village = document.getElementById("village").value.trim();
    const quantity = Number(document.getElementById("quantity").value);
    const date = dateInput.value;
    const slot = document.getElementById("slot").value;

    if (!name || !village || !date || !slot || quantity <= 0) {
      alert("Please enter all details correctly.");
      return;
    }

    if (date < getLocalDate()) {
      alert("Past dates are not allowed. Choose today or a future date.");
      return;
    }

    const activeInSlot = bookings.filter(booking =>
      booking.date === date &&
      booking.slot === slot &&
      booking.status === "Booked"
    );

    // Demo limit: 5 active bookings per slot
    if (activeInSlot.length >= 5) {
      alert("This demo slot is full! Please choose another time.");
      return;
    }

    const booking = {
      token: makeToken(),
      name,
      village,
      quantity,
      date,
      slot,
      status: "Booked",
      createdAt: new Date().toISOString()
    };

    bookings.push(booking);
    saveBookings();

    document.getElementById("bookingResult").innerHTML = `
      <div class="card">
        <h3>Booking Successful! ✅</h3>
        <p><b>Your Token:</b> ${escapeHTML(booking.token)}</p>
        <p><b>Farmer:</b> ${escapeHTML(booking.name)}</p>
        <p><b>Village:</b> ${escapeHTML(booking.village)}</p>
        <p><b>Quantity:</b> ${booking.quantity} quintals</p>
        <p><b>Date:</b> ${escapeHTML(booking.date)}</p>
        <p><b>Slot:</b> ${escapeHTML(booking.slot)}</p>
        <p><b>Status:</b> ${escapeHTML(booking.status)}</p>
        <button onclick="downloadReceipt('${booking.token}')">
          Download Receipt
        </button>
      </div>
    `;

    updateDashboard();
    updateQueue();
  });

// ---------- DASHBOARD ----------
function updateDashboard() {
  document.getElementById("totalBookings").textContent = bookings.length;
  document.getElementById("activeBookings").textContent =
    bookings.filter(item => item.status === "Booked").length;
  document.getElementById("completedBookings").textContent =
    bookings.filter(item => item.status === "Completed").length;
  document.getElementById("cancelledBookings").textContent =
    bookings.filter(item => item.status === "Cancelled").length;

  const recent = document.getElementById("recentBookings");
  const latestBookings = [...bookings].reverse().slice(0, 5);

  if (latestBookings.length === 0) {
    recent.textContent = "No bookings yet. Create your first booking!";
    return;
  }

  recent.innerHTML = latestBookings.map(booking => `
    <div class="booking-card" style="margin-top:12px">
      <h3>${escapeHTML(booking.token)}</h3>
      <p><b>Farmer:</b> ${escapeHTML(booking.name)}</p>
      <p><b>Date:</b> ${escapeHTML(booking.date)}</p>
      <p><b>Slot:</b> ${escapeHTML(booking.slot)}</p>
      <span class="status ${booking.status.toLowerCase()}">
        ${escapeHTML(booking.status)}
      </span>
    </div>
  `).join("");
}

// ---------- QUEUE TRACKER ----------
function updateQueue() {
  const box = document.getElementById("queueResult");

  if (bookings.length === 0) {
    box.innerHTML = `
      <div class="card">
        No bookings yet. Go to Book Slot to create a booking.
      </div>
    `;
    return;
  }

  box.innerHTML = [...bookings].reverse().map(booking => {
    const activeBookings = bookings.filter(item =>
      item.date === booking.date &&
      item.slot === booking.slot &&
      item.status === "Booked"
    );

    const position = activeBookings.findIndex(
      item => item.token === booking.token
    ) + 1;

    const queueText = position > 0 ? position : "—";

    return `
      <div class="booking-card">
        <h3>${escapeHTML(booking.token)}</h3>
        <p><b>Farmer:</b> ${escapeHTML(booking.name)}</p>
        <p><b>Village:</b> ${escapeHTML(booking.village)}</p>
        <p><b>Date:</b> ${escapeHTML(booking.date)}</p>
        <p><b>Slot:</b> ${escapeHTML(booking.slot)}</p>
        <p><b>Quantity:</b> ${booking.quantity} quintals</p>
        <p><b>Demo queue position:</b> ${queueText}</p>
        <p><b>Status:</b>
          <span class="status ${booking.status.toLowerCase()}">
            ${escapeHTML(booking.status)}
          </span>
        </p>

        <button onclick="downloadReceipt('${booking.token}')">
          Download Receipt
        </button>

        ${
          booking.status === "Booked"
            ? `
              <button onclick="completeBooking('${booking.token}')">
                Mark Completed
              </button>
              <button onclick="cancelBooking('${booking.token}')">
                Cancel Booking
              </button>
            `
            : ""
        }
      </div>
    `;
  }).join("");
}

// ---------- COMPLETE BOOKING ----------
function completeBooking(token) {
  const booking = bookings.find(item => item.token === token);

  if (!booking || booking.status !== "Booked") {
    alert("This booking cannot be completed.");
    return;
  }

  if (!confirm("Mark this booking as completed?")) return;

  booking.status = "Completed";
  saveBookings();
  updateDashboard();
  updateQueue();

  alert("Booking marked as completed!");
}

// ---------- CANCEL BOOKING ----------
function cancelBooking(token) {
  const booking = bookings.find(item => item.token === token);

  if (!booking || booking.status !== "Booked") {
    alert("This booking cannot be cancelled.");
    return;
  }

  if (!confirm("Are you sure you want to cancel this booking?")) return;

  booking.status = "Cancelled";
  saveBookings();
  updateDashboard();
  updateQueue();

  alert("Booking cancelled! The demo slot is available again.");
}

// ---------- DOWNLOAD RECEIPT ----------
function downloadReceipt(token) {
  const booking = bookings.find(item => item.token === token);

  if (!booking) {
    alert("Booking not found.");
    return;
  }

  const receipt = [
    "NELSLOT 360 - BOOKING RECEIPT",
    "--------------------------------",
    `Token: ${booking.token}`,
    `Farmer: ${booking.name}`,
    `Village: ${booking.village}`,
    `Quantity: ${booking.quantity} quintals`,
    `Date: ${booking.date}`,
    `Time Slot: ${booking.slot}`,
    `Status: ${booking.status}`,
    "--------------------------------",
    "This receipt is generated by a student demo prototype.",
    "Not an official procurement confirmation."
  ].join("\r\n");

  const blob = new Blob([receipt], {
    type: "text/plain;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `NelSlot360-${booking.token}.txt`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

// ---------- PADDY PRICE COMPARISON ----------
// Illustrative prices only; not live market data.
const demoBuyers = [
  { name: "Buyer A (Demo)", price: 2300 },
  { name: "Buyer B (Demo)", price: 2250 },
  { name: "Buyer C (Demo)", price: 2380 }
];

function comparePrices() {
  const quantity = Number(
    document.getElementById("priceQuantity").value
  );

  const transportCost = Number(
    document.getElementById("priceTransportCost").value
  );

  const results = document.getElementById("priceResults");

  if (!Number.isFinite(quantity) || quantity <= 0 ||
      !Number.isFinite(transportCost) || transportCost < 0) {
    results.textContent = "Enter a valid quantity and transport cost.";
    return;
  }

  const rows = demoBuyers.map(buyer => ({
    ...buyer,
    gross: buyer.price * quantity,
    net: buyer.price * quantity - transportCost
  }));

  const bestNet = Math.max(...rows.map(row => row.net));

  results.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Buyer</th>
          <th>Demo Price / Quintal</th>
          <th>Gross Amount</th>
          <th>Transport</th>
          <th>Estimated Net Return</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(row => `
          <tr>
            <td>${escapeHTML(row.name)}</td>
            <td>₹${row.price.toLocaleString("en-IN")}</td>
            <td>₹${row.gross.toLocaleString("en-IN")}</td>
            <td>₹${transportCost.toLocaleString("en-IN")}</td>
            <td class="${row.net === bestNet ? "best-price" : ""}">
              ₹${row.net.toLocaleString("en-IN")}
              ${row.net === bestNet ? " ★" : ""}
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    <p class="small-note">
      Estimate only. Actual returns may differ due to quality deductions,
      fees, transport and the final buyer price.
    </p>
  `;
}

// ---------- WEATHER PLANNING DEMO ----------
function checkWeather() {
  const weather = document.getElementById("weather").value;
  const result = document.getElementById("weatherResult");

  const messages = {
    clear: "☀️ Demo: No rain selected. Check the actual local forecast before travelling.",
    rain: "🌧️ Demo rain alert: Protect harvested paddy, arrange covered transport and check whether rescheduling is possible.",
    heat: "🌡️ Demo heat alert: Plan transport carefully, keep workers hydrated and protect stored paddy."
  };

  result.textContent = messages[weather] || messages.clear;
}

// ---------- SHARED TRANSPORT CALCULATOR ----------
document.getElementById("transportForm")
  .addEventListener("submit", function(event) {
    event.preventDefault();

    const route = document.getElementById("route").value.trim();
    const quantity = Number(document.getElementById("transportQty").value);
    const cost = Number(document.getElementById("transportCost").value);
    const result = document.getElementById("transportResult");

    if (!route || !Number.isFinite(quantity) || quantity <= 0 ||
        !Number.isFinite(cost) || cost < 0) {
      alert("Enter a valid route, quantity and cost.");
      return;
    }

    const perQuintal = cost / quantity;

    result.textContent =
      `Route: ${route}. Estimated shared transport cost: ₹${perQuintal.toFixed(2)} per quintal, assuming ₹${cost.toFixed(2)} is shared across ${quantity} quintals.`;
  });

// ---------- STARTUP ----------
applyLanguage();
updateDashboard();
updateQueue();
comparePrices();
