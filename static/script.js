let map
let marker
let currentImageUrl
let currentQueryId
let selectedTeam = null

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded") // Debugging
  const queryList = document.getElementById("query-list")

  if (!queryList) {
    console.error("Error: query-list element not found!")
    return
  }

  initMap()
  loadQueries()
  loadStats()
  setInterval(loadQueries, 5000)
  setInterval(loadStats, 5000)

  // Initialize event listeners
  initEventListeners()
})

function initEventListeners() {
  // Resolve button click
  document.getElementById("resolve-btn").addEventListener("click", resolveCurrentQuery)

  // Assign team button click
  document.getElementById("assign-btn").addEventListener("click", showTeamModal)

  // Confirm team assignment
  document.getElementById("confirm-team-btn").addEventListener("click", assignTeam)

  // Menu item clicks
  document.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", function () {
      const sectionId = this.getAttribute("data-section")
      switchSection(sectionId)
    })
  })

  // Notification icon click
  document.getElementById("notification-icon").addEventListener("click", (e) => {
    e.stopPropagation()
    toggleDropdown("notification-dropdown")
  })

  // Profile icon click
  document.getElementById("profile-icon").addEventListener("click", (e) => {
    e.stopPropagation()
    toggleDropdown("profile-dropdown")
  })

  // Filter button click
  document.getElementById("filter-btn").addEventListener("click", (e) => {
    e.stopPropagation()
    toggleDropdown("filter-menu")
  })

  // Close dropdowns when clicking outside
  document.addEventListener("click", () => {
    document.querySelectorAll(".dropdown-menu").forEach((menu) => {
      menu.classList.remove("show")
    })
  })

  // Load teams for the team modal
  loadTeams()
}

function toggleDropdown(dropdownId) {
  // Close all other dropdowns
  document.querySelectorAll(".dropdown-menu").forEach((menu) => {
    if (menu.classList.contains(dropdownId)) {
      menu.classList.toggle("show")
    } else {
      menu.classList.remove("show")
    }
  })
}

function switchSection(sectionId) {
  // Remove active class from all menu items
  document.querySelectorAll(".menu-item").forEach((item) => {
    item.classList.remove("active")
  })

  // Add active class to clicked menu item
  document.querySelector(`.menu-item[data-section="${sectionId}"]`).classList.add("active")

  // Hide all content sections
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.add("hidden")
  })

  // Show the selected section
  document.getElementById(sectionId).classList.remove("hidden")
}

async function loadStats() {
  try {
    const response = await fetch("/get_stats")
    const stats = await response.json()

    // Update stats
    document.getElementById("total-reports").textContent = stats.total
    document.getElementById("resolved-reports").textContent = stats.resolved
    document.getElementById("pending-reports").textContent = stats.pending
  } catch (error) {
    console.error("Error loading stats:", error)
  }
}

async function loadTeams() {
  try {
    const response = await fetch("/get_stats")
    const stats = await response.json()
    const teams = stats.teams

    // Populate team options in the modal
    const teamOptions = document.getElementById("team-options")
    teamOptions.innerHTML = ""

    teams.forEach((team) => {
      const teamOption = document.createElement("div")
      teamOption.className = "team-option"
      teamOption.innerHTML = `
                <input type="radio" name="team" id="team-${team.replace(/\s+/g, "-").toLowerCase()}" value="${team}">
                <label for="team-${team.replace(/\s+/g, "-").toLowerCase()}">${team}</label>
            `
      teamOption.addEventListener("click", () => {
        // Remove selected class from all options
        document.querySelectorAll(".team-option").forEach((option) => {
          option.classList.remove("selected")
        })

        // Add selected class to clicked option
        teamOption.classList.add("selected")

        // Set the selected team
        const radio = teamOption.querySelector("input")
        radio.checked = true
        selectedTeam = radio.value
      })

      teamOptions.appendChild(teamOption)
    })

    // Also populate the teams section if it exists
    const teamsContainer = document.getElementById("teams-container")
    if (teamsContainer) {
      teamsContainer.innerHTML = ""

      teams.forEach((team) => {
        const teamCard = document.createElement("div")
        teamCard.className = "team-card"
        teamCard.innerHTML = `
                    <div class="team-header">
                        <div class="team-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="team-name">${team}</div>
                    </div>
                    <div class="team-stats">
                        <div class="team-stat">
                            <div class="team-stat-value">0</div>
                            <div class="team-stat-label">Assigned</div>
                        </div>
                        <div class="team-stat">
                            <div class="team-stat-value">0</div>
                            <div class="team-stat-label">Resolved</div>
                        </div>
                    </div>
                    <div class="team-members">
                        <i class="fas fa-user"></i> Team Members: 4
                    </div>
                `

        teamsContainer.appendChild(teamCard)
      })
    }
  } catch (error) {
    console.error("Error loading teams:", error)
  }
}

async function loadQueries() {
  try {
    const response = await fetch("/all_queries")
    const queries = await response.json()

    const queryList = document.getElementById("query-list")

    // Clear loading placeholder if present
    const loadingPlaceholder = queryList.querySelector(".loading-placeholder")
    if (loadingPlaceholder) {
      queryList.removeChild(loadingPlaceholder)
    }

    // If no queries, show a message
    if (queries.length === 0) {
      const noReportsElement = document.createElement("div")
      noReportsElement.className = "loading-placeholder"
      noReportsElement.innerHTML = `
                <i class="fas fa-inbox"></i>
                <p>No reports available</p>
            `
      queryList.appendChild(noReportsElement)

      // Hide details section if it's visible
      document.getElementById("details-section").classList.add("hidden")
      return
    }

    // Check if we need to update the list
    if (queryList.children.length === queries.length && !loadingPlaceholder) {
      // Same number of queries, no need to update
      return
    }

    queryList.innerHTML = ""

    queries.forEach((query, index) => {
      const queryCard = document.createElement("div")
      queryCard.classList.add("query-card")

      // Format the coordinates to be more readable
      const lat = Number.parseFloat(query.latitude).toFixed(4)
      const lng = Number.parseFloat(query.longitude).toFixed(4)

      queryCard.innerHTML = `
                <div class="query-info">
                    <div class="query-title">Report #${index + 1}</div>
                    <div class="query-location">
                        <i class="fas fa-map-marker-alt"></i> 
                        ${lat}, ${lng}
                    </div>
                    <div class="query-time">
                        <i class="fas fa-clock"></i> 
                        ${query.timestamp || new Date().toLocaleDateString()}
                    </div>
                    ${
                      query.assigned_team
                        ? `
                    <div class="query-team">
                        <i class="fas fa-users"></i> 
                        ${query.assigned_team}
                    </div>`
                        : ""
                    }
                </div>
            `

      queryCard.onclick = () => {
        // Remove active class from all cards
        document.querySelectorAll(".query-card").forEach((card) => {
          card.classList.remove("active")
        })

        // Add active class to clicked card
        queryCard.classList.add("active")

        showDetails(query)
      }

      queryList.appendChild(queryCard)
    })

    // If this is the first load, show the first report
    if (queries.length > 0 && document.getElementById("details-section").classList.contains("hidden")) {
      document.querySelector(".query-card").classList.add("active")
      showDetails(queries[0])
    }
  } catch (error) {
    console.error("Error loading queries:", error)
  }
}

// Find the showDetails function and update it to ensure currentQueryId is properly set
function showDetails(query) {
  const imageElement = document.getElementById("uploaded-image")
  const detailsSection = document.getElementById("details-section")
  const mapContainer = document.getElementById("map")
  const modalImage = document.getElementById("modal-image")

  // Store the current query ID for actions
  currentQueryId = query.id !== undefined ? query.id : query.latitude + "-" + query.longitude
  console.log("Setting currentQueryId to:", currentQueryId)

  // Update image
  const imagePath = query.image_url
    ? query.image_url.startsWith("/")
      ? query.image_url
      : "/uploads/" + query.image_url
    : "/placeholder.svg"
  imageElement.src = imagePath
  currentImageUrl = imagePath
  modalImage.src = imagePath

  imageElement.style.display = "block"

  // Show details section
  detailsSection.classList.remove("hidden")
  mapContainer.style.display = "block"

  // Update map location
  updateMap(Number.parseFloat(query.latitude), Number.parseFloat(query.longitude))
}

function hideDetails() {
  const detailsSection = document.getElementById("details-section")
  detailsSection.classList.add("hidden")

  // Remove active class from all cards
  document.querySelectorAll(".query-card").forEach((card) => {
    card.classList.remove("active")
  })
}

function toggleImageZoom() {
  const modal = document.getElementById("image-modal")
  modal.classList.toggle("show")

  if (modal.classList.contains("show")) {
    document.body.style.overflow = "hidden"
  } else {
    document.body.style.overflow = ""
  }
}

function toggleTeamModal() {
  const modal = document.getElementById("team-modal")
  modal.classList.toggle("show")

  if (modal.classList.contains("show")) {
    document.body.style.overflow = "hidden"
  } else {
    document.body.style.overflow = ""
  }
}

// Update the showTeamModal function to check for currentQueryId more robustly
function showTeamModal() {
  console.log("Opening team modal for query ID:", currentQueryId)

  if (currentQueryId === undefined || currentQueryId === null) {
    showToast("No report selected", "warning")
    return
  }

  // Reset selected team
  selectedTeam = null
  document.querySelectorAll(".team-option").forEach((option) => {
    option.classList.remove("selected")
  })

  toggleTeamModal()
}

async function assignTeam() {
  if (!currentQueryId || !selectedTeam) {
    showToast("Please select a team", "warning")
    return
  }

  try {
    const response = await fetch("/assign_team", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query_id: currentQueryId,
        team_name: selectedTeam,
      }),
    })

    const result = await response.json()

    if (result.success) {
      showToast(`Report assigned to ${selectedTeam}`, "success")
      toggleTeamModal()
      loadQueries()
    } else {
      showToast("Failed to assign team: " + result.message, "error")
    }
  } catch (error) {
    console.error("Error assigning team:", error)
    showToast("Error assigning team", "error")
  }
}

// Update the resolveCurrentQuery function to check for currentQueryId more robustly
async function resolveCurrentQuery() {
  console.log("Resolving query with ID:", currentQueryId)

  if (currentQueryId === undefined || currentQueryId === null) {
    showToast("No report selected", "warning")
    return
  }

  try {
    const response = await fetch(`/resolve_query/${currentQueryId}`, {
      method: "POST",
    })

    const result = await response.json()

    if (result.success) {
      showToast("Report marked as resolved", "success")
      hideDetails()
      loadQueries()
      loadStats()
    } else {
      showToast("Failed to resolve report: " + (result.message || "Unknown error"), "error")
    }
  } catch (error) {
    console.error("Error resolving query:", error)
    showToast("Error resolving report", "error")
  }
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast")
  const toastIcon = toast.querySelector(".toast-icon")
  const toastMessage = toast.querySelector(".toast-message")

  // Set message
  toastMessage.textContent = message

  // Set icon based on type
  toastIcon.className = "fas toast-icon"
  switch (type) {
    case "success":
      toastIcon.classList.add("fa-check-circle")
      toastIcon.style.color = "var(--success-color)"
      break
    case "warning":
      toastIcon.classList.add("fa-exclamation-circle")
      toastIcon.style.color = "var(--warning-color)"
      break
    case "error":
      toastIcon.classList.add("fa-times-circle")
      toastIcon.style.color = "var(--danger-color)"
      break
    default:
      toastIcon.classList.add("fa-info-circle")
      toastIcon.style.color = "var(--info-color)"
  }

  // Show toast
  toast.classList.add("show")

  // Hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show")
  }, 3000)
}

function initMap() {
  map = L.map("map").setView([20.5937, 78.9629], 5)
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map)
}

function updateMap(lat, lng) {
  if (!map) {
    initMap()
  }

  if (marker) {
    marker.setLatLng([lat, lng])
  } else {
    marker = L.marker([lat, lng]).addTo(map)
  }

  // Force Leaflet to recalculate map size
  setTimeout(() => {
    map.invalidateSize()
    map.setView([lat, lng], 12)
  }, 100)
}

