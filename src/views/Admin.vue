<template>
  <div class="admin-page">
    <Navbar @logout="logout" />
    
    <div class="admin-container">
      <div class="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Manage cars, subscriptions, bookings, and swap requests</p>
      </div>

      <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
      <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">{{ stats.total_cars || 0 }}</div>
          <div class="stat-label">Total Cars</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.available_cars || 0 }}</div>
          <div class="stat-label">Available Cars</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.pending_bookings || 0 }}</div>
          <div class="stat-label">Pending Bookings</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.pending_swaps || 0 }}</div>
          <div class="stat-label">Pending Swaps</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.active_subscriptions || 0 }}</div>
          <div class="stat-label">Active Subscriptions</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="admin-tabs">
        <button :class="['tab-btn', { active: activeTab === 'bookings' }]" @click="activeTab = 'bookings'">
          Booking Requests
          <span v-if="stats.pending_bookings > 0" class="badge">{{ stats.pending_bookings }}</span>
        </button>
        <button :class="['tab-btn', { active: activeTab === 'swaps' }]" @click="activeTab = 'swaps'">
          Swap Requests
          <span v-if="stats.pending_swaps > 0" class="badge">{{ stats.pending_swaps }}</span>
        </button>
        <button :class="['tab-btn', { active: activeTab === 'returns' }]" @click="activeTab = 'returns'">
          Return Requests
          <span v-if="stats.pending_returns > 0" class="badge">{{ stats.pending_returns }}</span>
        </button>
        <button :class="['tab-btn', { active: activeTab === 'cars' }]" @click="activeTab = 'cars'">Cars</button>
        <button :class="['tab-btn', { active: activeTab === 'plans' }]" @click="activeTab = 'plans'">Plans</button>
        <button :class="['tab-btn', { active: activeTab === 'subscriptions' }]" @click="activeTab = 'subscriptions'">Subscriptions</button>
        <button :class="['tab-btn', { active: activeTab === 'users' }]" @click="activeTab = 'users'">Users</button>
        <button :class="['tab-btn', { active: activeTab === 'contacts' }]" @click="activeTab = 'contacts'">
          Messages
          <span v-if="stats.unread_contacts > 0" class="badge">{{ stats.unread_contacts }}</span>
        </button>
      </div>

      <!-- Booking Requests Tab -->
      <div v-if="activeTab === 'bookings'" class="tab-content">
        <div class="admin-card">
          <div class="card-header">
            <h3>Pending Booking Requests</h3>
            <div class="filter-group">
              <select v-model="bookingFilter" @change="loadBookings" class="form-control form-control-sm">
                <option value="">All Bookings</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          <div class="card-body">
            <div v-if="isLoadingBookings" class="loading">Loading...</div>
            <div v-else-if="bookingList.length === 0" class="empty-state">No booking requests</div>
            <table v-else class="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Car</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Note</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="booking in bookingList" :key="booking.id">
                  <td>
                    <div class="user-info">
                      <strong>{{ booking.user?.full_name || 'N/A' }}</strong>
                      <small>{{ booking.user?.email }}</small>
                    </div>
                  </td>
                  <td>
                    <div class="car-info">
                      <img v-if="booking.car?.image" :src="getCarImage(booking.car)" loading="lazy" :alt="booking.car.name" class="car-thumb" />
                      <div>
                        <strong>{{ booking.car?.brand }} {{ booking.car?.name }}</strong>
                        <small>{{ booking.car?.category }}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span :class="['status-badge', booking.status]">{{ booking.status }}</span>
                  </td>
                  <td>{{ formatDate(booking.created_at) }}</td>
                  <td>{{ booking.note || '-' }}</td>
                  <td>
                    <div v-if="booking.status === 'pending'" class="action-buttons">
                      <button class="btn-approve" @click="approveBooking(booking.id)" :disabled="isProcessing[booking.id]">
                        {{ isProcessing[booking.id] === 'approve' ? '...' : 'Approve' }}
                      </button>
                      <button class="btn-reject" @click="rejectBooking(booking.id)" :disabled="isProcessing[booking.id]">
                        {{ isProcessing[booking.id] === 'reject' ? '...' : 'Reject' }}
                      </button>
                    </div>
                    <span v-else class="text-muted">{{ booking.admin_note || '-' }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Swap Requests Tab -->
      <div v-if="activeTab === 'swaps'" class="tab-content">
        <div class="admin-card">
          <div class="card-header">
            <h3>Swap Requests</h3>
            <div class="filter-group">
              <select v-model="swapFilter" @change="loadSwaps" class="form-control form-control-sm">
                <option value="">All Swaps</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          <div class="card-body">
            <div v-if="isLoadingSwaps" class="loading">Loading...</div>
            <div v-else-if="swapList.length === 0" class="empty-state">No swap requests</div>
            <table v-else class="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>From Car</th>
                  <th>To Car</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="swap in swapList" :key="swap.id">
                  <td>
                    <div class="user-info">
                      <strong>{{ swap.user?.full_name || 'N/A' }}</strong>
                      <small>{{ swap.user?.email }}</small>
                    </div>
                  </td>
                  <td>{{ swap.from_car ? `${swap.from_car.brand} ${swap.from_car.name}` : 'N/A' }}</td>
                  <td>{{ swap.to_car ? `${swap.to_car.brand} ${swap.to_car.name}` : 'N/A' }}</td>
                  <td>
                    <span :class="['status-badge', swap.status || 'pending']">{{ swap.status || 'pending' }}</span>
                  </td>
                  <td>{{ formatDate(swap.timestamp) }}</td>
                  <td>
                    <div v-if="swap.status === 'pending'" class="action-buttons">
                      <button class="btn-approve" @click="approveSwap(swap.id)" :disabled="isProcessingSwap[swap.id]">
                        {{ isProcessingSwap[swap.id] === 'approve' ? '...' : 'Approve' }}
                      </button>
                      <button class="btn-reject" @click="rejectSwap(swap.id)" :disabled="isProcessingSwap[swap.id]">
                        {{ isProcessingSwap[swap.id] === 'reject' ? '...' : 'Reject' }}
                      </button>
                    </div>
                    <span v-else class="text-muted">{{ swap.admin_note || '-' }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Return Requests Tab -->
      <div v-if="activeTab === 'returns'" class="tab-content">
        <div class="admin-card">
          <div class="card-header">
            <h3>Return Requests</h3>
            <div class="filter-group">
              <select v-model="returnFilter" @change="loadReturnRequests" class="form-control form-control-sm">
                <option value="">All Returns</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          <div class="card-body">
            <div v-if="isLoadingReturns" class="loading">Loading...</div>
            <div v-else-if="returnList.length === 0" class="empty-state">No return requests</div>
            <table v-else class="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Car</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ret in returnList" :key="ret.id">
                  <td>
                    <div class="user-info">
                      <strong>{{ ret.user?.full_name || 'N/A' }}</strong>
                      <small>{{ ret.user?.email }}</small>
                    </div>
                  </td>
                  <td>
                    <div class="car-info">
                      <img v-if="ret.car?.image" :src="getCarImage(ret.car)" loading="lazy" :alt="ret.car.name" class="car-thumb" />
                      <div>
                        <strong>{{ ret.car?.brand }} {{ ret.car?.name }}</strong>
                        <small>{{ ret.car?.category }}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span :class="['status-badge', ret.status || 'pending']">{{ ret.status || 'pending' }}</span>
                  </td>
                  <td>
                    <small>{{ ret.reason || '-' }}</small>
                  </td>
                  <td>{{ formatDate(ret.created_at) }}</td>
                  <td>
                    <div v-if="ret.status === 'pending'" class="action-buttons">
                      <button class="btn-approve" @click="approveReturn(ret.id)" :disabled="isProcessingReturn[ret.id]">
                        {{ isProcessingReturn[ret.id] === 'approve' ? '...' : 'Approve' }}
                      </button>
                      <button class="btn-reject" @click="rejectReturn(ret.id)" :disabled="isProcessingReturn[ret.id]">
                        {{ isProcessingReturn[ret.id] === 'reject' ? '...' : 'Reject' }}
                      </button>
                    </div>
                    <span v-else class="text-muted">{{ ret.admin_note || '-' }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Cars Tab -->
      <div v-if="activeTab === 'cars'" class="tab-content">
        <!-- Add/Edit Car Form -->
        <div class="admin-card">
          <div class="card-header">
            <h3>{{ editingCarId ? '✏️ Edit Car' : '➕ Add New Car' }}</h3>
          </div>
          <div class="card-body">
            <div class="form-grid">
              <div class="form-group">
                <label>Brand *</label>
                <input 
                  v-model="newCar.brand" 
                  type="text" 
                  class="form-control"
                  placeholder="e.g., Maruti"
                />
                <small v-if="carErrors.brand" class="error-text">{{ carErrors.brand }}</small>
              </div>

              <div class="form-group">
                <label>Model *</label>
                <input 
                  v-model="newCar.name" 
                  type="text" 
                  class="form-control"
                  placeholder="e.g., Swift"
                />
                <small v-if="carErrors.name" class="error-text">{{ carErrors.name }}</small>
              </div>

              <div class="form-group">
                <label>Category</label>
                <select v-model="newCar.category" class="form-control">
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>

              <div class="form-group">
                <label>Required Tier *</label>
                <select v-model="newCar.required_plan" class="form-control">
                  <option value="">Select Tier</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="luxury">Luxury</option>
                </select>
                <small v-if="carErrors.tier" class="error-text">{{ carErrors.tier }}</small>
              </div>

              <div class="form-group">
                <label>Available Status</label>
                <select v-model="newCar.available" class="form-control">
                  <option :value="true">✓ Available</option>
                  <option :value="false">✗ Unavailable</option>
                </select>
              </div>

              <div class="form-group">
                <label>Image Upload</label>
                <input 
                  ref="imageInput"
                  type="file" 
                  accept="image/*" 
                  @change="handleImageSelect" 
                  class="form-control" 
                />
                <div v-if="imagePreview" class="image-preview">
                  <img :src="imagePreview" loading="lazy" :alt="Preview" />
                  <button type="button" class="remove-btn" @click="clearImage">✕</button>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button 
                class="cs-btn-primary" 
                @click="submitCarForm"
                :disabled="isAdding"
              >
                {{ isAdding ? '⏳ Processing...' : (editingCarId ? '💾 Update Car' : '➕ Add Car') }}
              </button>
              <button 
                v-if="editingCarId"
                class="cs-btn-secondary" 
                @click="cancelEditCar"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- Cars Grid -->
        <div class="admin-card">
          <div class="card-header">
            <h3>🚗 Fleet Management</h3>
            <span class="badge">{{ carList.length }} cars</span>
          </div>
          <div class="card-body">
            <div v-if="carList.length === 0" class="empty-state">
              <p>No cars added yet. Add your first car above!</p>
            </div>
            <div v-else class="cars-grid">
              <div 
                v-for="car in carList" 
                :key="car.id" 
                class="car-card"
              >
                <div class="car-image">
                  <img v-if="car.image" :src="getCarImage(car)" loading="lazy" :alt="car.name" />
                  <div v-else class="placeholder">🚗</div>
                  <span :class="['status-badge', car.available ? 'available' : 'unavailable']">
                    {{ car.available ? 'Available' : 'In Use' }}
                  </span>
                </div>
                <div class="car-info">
                  <h4>{{ car.brand }} {{ car.name }}</h4>
                  <p>{{ car.category || 'Sedan' }}</p>
                  <div class="car-tier">
                    <span :class="['plan-badge', car.required_plan]">
                      {{ car.required_plan?.toUpperCase() || 'BASIC' }}
                    </span>
                  </div>
                </div>
                <div class="car-actions">
                  <button 
                    class="btn-edit" 
                    @click="editCar(car)"
                  >
                    ✏️
                  </button>
                  <button 
                    class="btn-delete" 
                    @click="confirmDeleteCar(car)"
                    :disabled="isDeleting[car.id]"
                  >
                    {{ isDeleting[car.id] ? '...' : '🗑️' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Plans Tab -->
      <div v-if="activeTab === 'plans'" class="tab-content">
        <!-- Add Plan Form -->
        <div class="admin-card">
          <div class="card-header">
            <h3>{{ editingPlanId ? '✏️ Edit Plan' : '➕ Add New Plan' }}</h3>
          </div>
          <div class="card-body">
            <div class="form-grid">
              <div class="form-group">
                <label>Plan Name *</label>
                <input 
                  v-model="newPlan.name" 
                  type="text" 
                  class="form-control"
                  placeholder="e.g., Premium"
                />
                <small v-if="planErrors.name" class="error-text">{{ planErrors.name }}</small>
              </div>

              <div class="form-group">
                <label>Price (₹/month) *</label>
                <input 
                  v-model.number="newPlan.price" 
                  type="number" 
                  class="form-control"
                  placeholder="e.g., 40000"
                  min="0"
                />
                <small v-if="planErrors.price" class="error-text">{{ planErrors.price }}</small>
              </div>

              <div class="form-group">
                <label>Duration (months) *</label>
                <input 
                  v-model.number="newPlan.duration_months" 
                  type="number" 
                  class="form-control"
                  placeholder="e.g., 1"
                  min="1"
                />
                <small v-if="planErrors.duration" class="error-text">{{ planErrors.duration }}</small>
              </div>

              <div class="form-group">
                <label>Swap Limit *</label>
                <input 
                  v-model.number="newPlan.swap_limit" 
                  type="number" 
                  class="form-control"
                  placeholder="e.g., 5"
                  min="0"
                />
                <small v-if="planErrors.swaps" class="error-text">{{ planErrors.swaps }}</small>
              </div>

              <div class="form-group">
                <label>Tier *</label>
                <select v-model="newPlan.tier" class="form-control">
                  <option value="">Select Tier</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="luxury">Luxury</option>
                </select>
                <small v-if="planErrors.tier" class="error-text">{{ planErrors.tier }}</small>
              </div>

              <div class="form-group">
                <label>Max Cars per Booking *</label>
                <input 
                  v-model.number="newPlan.max_active_bookings" 
                  type="number" 
                  class="form-control"
                  placeholder="e.g., 3"
                  min="1"
                />
                <small v-if="planErrors.bookings" class="error-text">{{ planErrors.bookings }}</small>
              </div>
            </div>

            <div class="form-actions">
              <button 
                class="cs-btn-primary" 
                @click="submitPlanForm"
                :disabled="isAddingPlan"
              >
                {{ isAddingPlan ? '⏳ Processing...' : (editingPlanId ? '💾 Update Plan' : '➕ Add Plan') }}
              </button>
              <button 
                v-if="editingPlanId"
                class="cs-btn-secondary" 
                @click="cancelEditPlan"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- Plans List -->
        <div class="admin-card">
          <div class="card-header">
            <h3>📊 All Subscription Plans</h3>
            <span class="badge">{{ planList.length }} plans</span>
          </div>
          <div class="card-body">
            <div v-if="planList.length === 0" class="empty-state">
              <p>No plans created yet. Add your first plan above!</p>
            </div>
            <table v-else class="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Tier</th>
                  <th>Duration</th>
                  <th>Swaps</th>
                  <th>Max Cars</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="plan in planList" :key="plan.id">
                  <td><strong>{{ plan.name }}</strong></td>
                  <td>₹{{ plan.price?.toLocaleString() || 0 }}/mo</td>
                  <td>
                    <span :class="['tier-badge', plan.tier]">
                      {{ plan.tier?.toUpperCase() }}
                    </span>
                  </td>
                  <td>{{ plan.duration_months }} month(s)</td>
                  <td>{{ plan.swap_limit }}</td>
                  <td>{{ plan.max_active_bookings }}</td>
                  <td>
                    <button 
                      class="btn-edit" 
                      @click="editPlan(plan)"
                    >
                      ✏️
                    </button>
                    <button 
                      class="btn-delete" 
                      @click="confirmDeletePlan(plan)"
                      :disabled="isDeletingPlan[plan.id]"
                    >
                      {{ isDeletingPlan[plan.id] ? '...' : '🗑️' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Subscriptions Tab -->
      <div v-if="activeTab === 'subscriptions'" class="tab-content">
        <div class="admin-card">
          <div class="card-header">
            <h3>All Subscriptions</h3>
          </div>
          <div class="card-body">
            <div v-if="subscriptionList.length === 0" class="empty-state">No subscriptions yet</div>
            <table v-else class="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Plan</th>
                  <th>Car</th>
                  <th>Active Driver</th>
                  <th>Pickup Location</th>
                  <th>Status</th>
                  <th>Swaps Used</th>
                  <th>Expires</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="sub in subscriptionList" :key="sub.id">
                  <td>
                    <div class="user-info">
                      <strong>{{ sub.user?.full_name || 'N/A' }}</strong>
                      <small>{{ sub.user?.email }}</small>
                    </div>
                  </td>
                  <td>
                    <span :class="['plan-badge', sub.plan?.tier || 'basic']">{{ sub.plan?.name || 'N/A' }}</span>
                  </td>
                  <td>{{ sub.car ? `${sub.car.brand} ${sub.car.name}` : 'No Car' }}</td>
                  <td>
                    <span :class="['status-badge', sub.needs_driver ? 'approved' : 'unavailable']">
                      {{ sub.needs_driver ? 'Active' : 'No' }}
                    </span>
                  </td>
                  <td>
                    <span class="pickup-location">
                      {{ getDriverPickupLocation(sub) }}
                    </span>
                  </td>
                  <td>
                    <span :class="['status-badge', sub.active ? 'approved' : 'unavailable']">
                      {{ sub.active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>{{ sub.swaps_count }}</td>
                  <td>{{ formatDate(sub.end_date) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Users Tab -->
      <div v-if="activeTab === 'users'" class="tab-content">
        <div class="admin-card">
          <div class="card-header">
            <h3>Registered Users</h3>
          </div>
          <div class="card-body">
            <div v-if="userList.length === 0" class="empty-state">No users registered yet</div>
            <table v-else class="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in userList" :key="user.id">
                  <td>#{{ user.id }}</td>
                  <td>{{ user.full_name || 'N/A' }}</td>
                  <td>{{ user.email }}</td>
                  <td>
                    <span :class="['status-badge', user.is_admin ? 'approved' : 'pending']">
                      {{ user.is_admin ? 'Admin' : 'User' }}
                    </span>
                  </td>
                  <td>
                    <button 
                      class="btn-delete" 
                      @click="deleteUser(user.id)"
                      :disabled="isDeletingUser[user.id]"
                      title="Delete this user"
                    >
                      {{ isDeletingUser[user.id] ? '...' : '🗑️ Delete' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Contacts Tab -->
      <div v-if="activeTab === 'contacts'" class="tab-content">
        <div class="admin-card">
          <div class="card-header">
            <h3>Contact Messages</h3>
          </div>
          <div class="card-body">
            <div v-if="isLoadingContacts" class="loading">Loading...</div>
            <div v-else-if="contactList.length === 0" class="empty-state">No messages yet</div>
            <div v-else class="contact-messages">
              <div v-for="contact in contactList" :key="contact.id" :class="['contact-message', { unread: !contact.read }]">
                <div class="contact-header">
                  <div class="contact-sender">
                    <strong>{{ contact.name }}</strong>
                    <span>{{ contact.email }}</span>
                  </div>
                  <div class="contact-date">{{ formatDate(contact.created_at) }}</div>
                </div>
                <div class="contact-body">{{ contact.message }}</div>
                <div class="contact-actions">
                  <button v-if="!contact.read" class="btn-approve" @click="markContactRead(contact.id)">Mark Read</button>
                  <button class="btn-delete" @click="deleteContact(contact.id)">Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click="showDeleteConfirm = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>⚠️ Confirm Delete</h3>
        </div>
        <div class="modal-body">
          <p v-if="deleteType === 'plan'">
            Are you sure you want to delete the <strong>{{ itemToDelete?.name }}</strong> plan?
          </p>
          <p v-else>
            Are you sure you want to delete the <strong>{{ itemToDelete?.brand }} {{ itemToDelete?.name }}</strong> car?
          </p>
          <p class="warning">This action cannot be undone.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showDeleteConfirm = false">Cancel</button>
          <button class="btn-delete-confirm" @click="confirmDeleteAction">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import { adminAPI } from '../services/api'
import { useUser } from '../composables/useUser'

const router = useRouter()
const activeTab = ref('bookings')

// Data
const stats = ref({})
const carList = ref([])
const planList = ref([])
const userList = ref([])
const subscriptionList = ref([])
const swapList = ref([])
const bookingList = ref([])
const contactList = ref([])
const returnList = ref([])

// Loading states
const isLoading = ref(true)
const isLoadingBookings = ref(true)
const isLoadingSwaps = ref(true)
const isLoadingReturns = ref(true)
const isLoadingContacts = ref(true)
const isAdding = ref(false)
const isAddingPlan = ref(false)
const isDeleting = reactive({})
const isDeletingPlan = reactive({})
const isDeletingUser = reactive({})
const isProcessing = reactive({})
const isProcessingSwap = reactive({})
const isProcessingReturn = reactive({})

// Filters
const bookingFilter = ref('')
const swapFilter = ref('')
const returnFilter = ref('')

// Messages
const errorMessage = ref('')
const successMessage = ref('')

// Form data
const newCar = reactive({ brand: '', name: '', category: 'Sedan', required_plan: 'basic', available: true })
const newPlan = reactive({ name: '', price: 0, duration_months: 1, swap_limit: 0, tier: '', max_active_bookings: 1 })

// Edit states
const editingCarId = ref(null)
const editingPlanId = ref(null)

// Form errors
const carErrors = reactive({ brand: '', name: '', tier: '' })
const planErrors = reactive({ name: '', price: '', duration: '', swaps: '', tier: '', bookings: '' })

// Delete confirmation
const showDeleteConfirm = ref(false)
const deleteType = ref('') // 'plan' or 'car'
const itemToDelete = ref(null)

// Tier pricing
const tierPrices = reactive({ basic: 29, premium: 79, luxury: 149 })
const isSavingPrices = ref(false)

// Image upload
const imageFile = ref(null)
const imagePreview = ref(null)

const handleImageSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    imageFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const clearImage = () => {
  imageFile.value = null
  imagePreview.value = null
  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

// Helpers
const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

const parseDriverServiceDetails = (details) => {
  if (!details) return null
  if (typeof details === 'object') return details

  try {
    return JSON.parse(details)
  } catch (error) {
    return null
  }
}

const getDriverPickupLocation = (sub) => {
  const details = parseDriverServiceDetails(sub?.driver_service_details)
  return details?.pickupLocation || details?.pickup_location || 'N/A'
}

const getCarImage = (car) => {
  if (!car?.image) return null
  if (car.image.startsWith('http')) return car.image
  return `https://cardb-1.onrender.com${car.image}`
}

const showSuccess = (msg) => {
  successMessage.value = msg
  setTimeout(() => successMessage.value = '', 3000)
}

const showError = (msg) => {
  errorMessage.value = msg
  setTimeout(() => errorMessage.value = '', 5000)
}

// Load functions
const loadStats = async () => {
  try {
    const response = await adminAPI.getStats()
    stats.value = response.data
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

const loadCars = async () => {
  try {
    const response = await adminAPI.listCars()
    carList.value = response.data
  } catch (error) {
    console.error('Failed to load cars:', error)
  } finally {
    isLoading.value = false
  }
}

const loadPlans = async () => {
  try {
    const response = await adminAPI.listPlans()
    planList.value = response.data
  } catch (error) {
    console.error('Failed to load plans:', error)
  }
}

const loadUsers = async () => {
  try {
    const response = await adminAPI.listUsers()
    userList.value = response.data
  } catch (error) {
    console.error('Failed to load users:', error)
  }
}

const loadSubscriptions = async () => {
  try {
    const response = await adminAPI.listSubscriptions()
    subscriptionList.value = response.data
  } catch (error) {
    console.error('Failed to load subscriptions:', error)
  }
}

const loadBookings = async () => {
  isLoadingBookings.value = true
  try {
    const response = await adminAPI.listBookings(bookingFilter.value || null)
    bookingList.value = response.data
  } catch (error) {
    console.error('Failed to load bookings:', error)
  } finally {
    isLoadingBookings.value = false
  }
}

const loadSwaps = async () => {
  isLoadingSwaps.value = true
  try {
    const response = await adminAPI.listSwapRequests(swapFilter.value || null)
    swapList.value = response.data
  } catch (error) {
    console.error('Failed to load swaps:', error)
  } finally {
    isLoadingSwaps.value = false
  }
}

const loadReturnRequests = async () => {
  isLoadingReturns.value = true
  try {
    const response = await adminAPI.listReturnRequests(returnFilter.value || null)
    returnList.value = response.data
  } catch (error) {
    console.error('Failed to load return requests:', error)
  } finally {
    isLoadingReturns.value = false
  }
}

const loadContacts = async () => {
  isLoadingContacts.value = true
  try {
    const response = await adminAPI.listContacts()
    contactList.value = response.data
  } catch (error) {
    console.error('Failed to load contacts:', error)
  } finally {
    isLoadingContacts.value = false
  }
}

// Booking actions
const approveBooking = async (bookingId) => {
  isProcessing[bookingId] = 'approve'
  try {
    const response = await adminAPI.approveBooking(bookingId)
    showSuccess(response.data?.detail || 'Booking request processed successfully!')
    await Promise.all([loadBookings(), loadStats()])
  } catch (error) {
    showError(error.response?.data?.detail || 'Failed to approve booking')
  } finally {
    delete isProcessing[bookingId]
  }
}

const rejectBooking = async (bookingId) => {
  isProcessing[bookingId] = 'reject'
  try {
    await adminAPI.rejectBooking(bookingId)
    showSuccess('Booking rejected')
    await Promise.all([loadBookings(), loadStats()])
  } catch (error) {
    showError(error.response?.data?.detail || 'Failed to reject booking')
  } finally {
    delete isProcessing[bookingId]
  }
}

// Swap actions
const approveSwap = async (swapId) => {
  isProcessingSwap[swapId] = 'approve'
  try {
    await adminAPI.approveSwap(swapId)
    showSuccess('Swap approved successfully!')
    await Promise.all([loadSwaps(), loadStats()])
  } catch (error) {
    showError(error.response?.data?.detail || 'Failed to approve swap')
  } finally {
    delete isProcessingSwap[swapId]
  }
}

const rejectSwap = async (swapId) => {
  isProcessingSwap[swapId] = 'reject'
  try {
    await adminAPI.rejectSwap(swapId)
    showSuccess('Swap rejected')
    await Promise.all([loadSwaps(), loadStats()])
  } catch (error) {
    showError(error.response?.data?.detail || 'Failed to reject swap')
  } finally {
    delete isProcessingSwap[swapId]
  }
}

// Return request actions
const approveReturn = async (returnId) => {
  isProcessingReturn[returnId] = 'approve'
  try {
    await adminAPI.approveReturnRequest(returnId)
    showSuccess('Return request approved! Subscription has been ended.')
    await Promise.all([loadReturnRequests(), loadStats()])
  } catch (error) {
    showError(error.response?.data?.detail || 'Failed to approve return request')
  } finally {
    delete isProcessingReturn[returnId]
  }
}

const rejectReturn = async (returnId) => {
  isProcessingReturn[returnId] = 'reject'
  try {
    await adminAPI.rejectReturnRequest(returnId)
    showSuccess('Return request rejected')
    await Promise.all([loadReturnRequests(), loadStats()])
  } catch (error) {
    showError(error.response?.data?.detail || 'Failed to reject return request')
  } finally {
    delete isProcessingReturn[returnId]
  }
}


// Plan Validation
const validatePlan = () => {
  planErrors.name = ''
  planErrors.price = ''
  planErrors.duration = ''
  planErrors.swaps = ''
  planErrors.tier = ''
  planErrors.bookings = ''

  let isValid = true

  if (!newPlan.name?.trim()) {
    planErrors.name = 'Plan name is required'
    isValid = false
  }

  if (!newPlan.price || newPlan.price <= 0) {
    planErrors.price = 'Valid price is required'
    isValid = false
  }

  if (!newPlan.duration_months || newPlan.duration_months < 1) {
    planErrors.duration = 'Duration must be at least 1 month'
    isValid = false
  }

  if (newPlan.swap_limit === null || newPlan.swap_limit < 0) {
    planErrors.swaps = 'Valid swap limit required'
    isValid = false
  }

  if (!newPlan.tier) {
    planErrors.tier = 'Tier is required'
    isValid = false
  }

  if (!newPlan.max_active_bookings || newPlan.max_active_bookings < 1) {
    planErrors.bookings = 'Max bookings must be at least 1'
    isValid = false
  }

  return isValid
}

// Plan Actions
const submitPlanForm = async () => {
  if (!validatePlan()) return

  isAddingPlan.value = true
  try {
    if (editingPlanId.value) {
      await adminAPI.updatePlan(editingPlanId.value, newPlan)
      showSuccess(`✓ Plan "${newPlan.name}" updated successfully!`)
    } else {
      await adminAPI.createPlan(newPlan)
      showSuccess(`✓ Plan "${newPlan.name}" created successfully!`)
    }

    await loadPlans()
    Object.assign(newPlan, { name: '', price: 0, duration_months: 1, swap_limit: 0, tier: '', max_active_bookings: 1 })
    editingPlanId.value = null
  } catch (error) {
    showError('Failed to save plan: ' + (error.response?.data?.detail || error.message))
  } finally {
    isAddingPlan.value = false
  }
}

const editPlan = (plan) => {
  editingPlanId.value = plan.id
  Object.assign(newPlan, { ...plan })
  activeTab.value = 'plans'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const cancelEditPlan = () => {
  editingPlanId.value = null
  Object.assign(newPlan, { name: '', price: 0, duration_months: 1, swap_limit: 0, tier: '', max_active_bookings: 1 })
  planErrors.name = ''
  planErrors.price = ''
  planErrors.duration = ''
  planErrors.swaps = ''
  planErrors.tier = ''
  planErrors.bookings = ''
}

const confirmDeletePlan = (plan) => {
  showDeleteConfirm.value = true
  deleteType.value = 'plan'
  itemToDelete.value = plan
}

const saveTierPrices = async () => {
  isSavingPrices.value = true
  try {
    localStorage.setItem('tierPrices', JSON.stringify(tierPrices))
    showSuccess('Tier prices saved successfully!')
  } catch (error) {
    showError('Failed to save tier prices')
  } finally {
    isSavingPrices.value = false
  }
}

const loadTierPrices = () => {
  try {
    const saved = localStorage.getItem('tierPrices')
    if (saved) {
      Object.assign(tierPrices, JSON.parse(saved))
    }
  } catch (error) {
    console.error('Failed to load tier prices:', error)
  }
}

// Car Validation
const validateCar = () => {
  carErrors.brand = ''
  carErrors.name = ''
  carErrors.tier = ''

  let isValid = true

  if (!newCar.brand?.trim()) {
    carErrors.brand = 'Brand is required'
    isValid = false
  }

  if (!newCar.name?.trim()) {
    carErrors.name = 'Model name is required'
    isValid = false
  }

  if (!newCar.required_plan) {
    carErrors.tier = 'Tier is required'
    isValid = false
  }

  return isValid
}

// Car actions
const submitCarForm = async () => {
  if (!validateCar()) return

  isAdding.value = true
  try {
    if (editingCarId.value) {
      await adminAPI.updateCar(editingCarId.value, newCar)
      showSuccess(`✓ Car "${newCar.brand} ${newCar.name}" updated!`)
    } else {
      if (imageFile.value) {
        const formData = new FormData()
        formData.append('brand', newCar.brand)
        formData.append('name', newCar.name)
        formData.append('category', newCar.category)
        formData.append('required_plan', newCar.required_plan)
        formData.append('available', newCar.available)
        formData.append('image', imageFile.value)
        await adminAPI.createCarWithUpload(formData)
      } else {
        await adminAPI.createCar(newCar)
      }
      showSuccess(`✓ Car "${newCar.brand} ${newCar.name}" created!`)
    }

    await loadCars()
    Object.assign(newCar, { brand: '', name: '', category: 'Sedan', required_plan: 'basic', available: true })
    editingCarId.value = null
    clearImage()
    await loadStats()
  } catch (error) {
    showError('Failed to save car: ' + (error.response?.data?.detail || error.message))
  } finally {
    isAdding.value = false
  }
}

const editCar = (car) => {
  editingCarId.value = car.id
  Object.assign(newCar, { ...car })
  activeTab.value = 'cars'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const cancelEditCar = () => {
  editingCarId.value = null
  Object.assign(newCar, { brand: '', name: '', category: 'Sedan', required_plan: 'basic', available: true })
  carErrors.brand = ''
  carErrors.name = ''
  carErrors.tier = ''
  clearImage()
}

const confirmDeleteCar = (car) => {
  showDeleteConfirm.value = true
  deleteType.value = 'car'
  itemToDelete.value = car
}

const confirmDeleteAction = async () => {
  if (!itemToDelete.value) return

  const itemId = itemToDelete.value.id

  try {
    if (deleteType.value === 'plan') {
      isDeletingPlan[itemId] = true
      await adminAPI.deletePlan(itemId)
      showSuccess(`✓ Plan "${itemToDelete.value.name}" deleted!`)
      await loadPlans()
    } else {
      isDeleting[itemId] = true
      await adminAPI.deleteCar(itemId)
      showSuccess('✓ Car deleted!')
      await loadCars()
    }
    
    await loadStats()
    showDeleteConfirm.value = false
    itemToDelete.value = null
    deleteType.value = ''
  } catch (error) {
    showError('Failed to delete: ' + (error.response?.data?.detail || error.message))
  } finally {
    if (deleteType.value === 'plan') {
      delete isDeletingPlan[itemId]
    } else {
      delete isDeleting[itemId]
    }
  }
}

// Delete user
const deleteUser = async (userId) => {
  if (!confirm('⚠️ Are you sure you want to delete this user? This action cannot be undone!')) {
    return
  }
  
  if (!confirm('🚨 This will permanently delete the user and all their data. Continue?')) {
    return
  }
  
  isDeletingUser[userId] = true
  try {
    await adminAPI.deleteUser(userId)
    showSuccess('✓ User deleted successfully!')
    await loadUsers()
  } catch (error) {
    showError('Failed to delete user: ' + (error.response?.data?.detail || error.message))
  } finally {
    delete isDeletingUser[userId]
  }
}

// Contact actions
const markContactRead = async (contactId) => {
  try {
    await adminAPI.markContactRead(contactId)
    await loadContacts()
    await loadStats()
  } catch (error) {
    showError('Failed to mark as read')
  }
}

const deleteContact = async (contactId) => {
  if (!confirm('Delete this message?')) return
  try {
    await adminAPI.deleteContact(contactId)
    await loadContacts()
    await loadStats()
  } catch (error) {
    showError('Failed to delete message')
  }
}

const logout = () => {
  const { clearUser } = useUser()
  clearUser()
  router.push('/login')
}

onMounted(async () => {
  loadTierPrices()
  await Promise.all([
    loadStats(),
    loadCars(),
    loadPlans(),
    loadUsers(),
    loadSubscriptions(),
    loadBookings(),
    loadSwaps(),
    loadReturnRequests(),
    loadContacts()
  ])
})
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #f5f6fa;
  padding-top: var(--cs-navbar-offset);
}

.pickup-location {
  display: inline-block;
  max-width: 220px;
  white-space: normal;
  word-break: break-word;
}

.admin-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.admin-header {
  margin-bottom: 2rem;
}

.admin-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.admin-header p {
  color: #666;
}

/* Tab badges */
.tab-btn {
  position: relative;
}

.tab-btn .badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff4d30;
  color: #fff;
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
  min-width: 18px;
}

/* Card header with filter */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f0f0f0;
}

.card-header h3 {
  margin: 0;
}

.filter-group {
  min-width: 150px;
}

.filter-group .form-control-sm {
  padding: 0.5rem;
  font-size: 0.9rem;
}

/* User and car info cells */
.user-info, .car-info {
  display: flex;
  flex-direction: column;
}

.car-info {
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
}

.user-info strong, .car-info strong {
  font-size: 0.9rem;
}

.user-info small, .car-info small {
  color: #888;
  font-size: 0.8rem;
}

.car-thumb {
  width: 60px;
  height: 40px;
  object-fit: cover;
  border-radius: 6px;
}

.car-thumb-placeholder {
  width: 60px;
  height: 40px;
  background: #f0f0f0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: #999;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

/* Plan badges */
.plan-badge {
  display: inline-block;
  padding: 0.25rem 0.65rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.plan-badge.basic {
  background: #e8f5e9;
  color: #2e7d32;
}

.plan-badge.premium {
  background: #e3f2fd;
  color: #1565c0;
}

.plan-badge.luxury {
  background: #fce4ec;
  color: #c2185b;
}

/* Contact messages */
.contact-messages {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.contact-message {
  background: #fafafa;
  border-radius: 12px;
  padding: 1.25rem;
  border-left: 4px solid #ddd;
}

.contact-message.unread {
  background: #fffbf0;
  border-left-color: #ff4d30;
}

.contact-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.contact-sender {
  display: flex;
  flex-direction: column;
}

.contact-sender strong {
  font-size: 1rem;
}

.contact-sender span {
  color: #666;
  font-size: 0.85rem;
}

.contact-date {
  color: #888;
  font-size: 0.8rem;
}

.contact-body {
  color: #333;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.contact-actions {
  display: flex;
  gap: 0.5rem;
}

/* Image Upload */
.image-upload-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.image-preview {
  position: relative;
  width: 200px;
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e0e0e0;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 0, 0, 0.8);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.remove-image:hover {
  background: rgba(200, 0, 0, 1);
}

/* Edit Button */
.btn-edit {
  padding: 0.4rem 0.8rem;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-edit:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-1px);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #1e293b;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body .form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 0 0 16px 16px;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: #e2e8f0;
  color: #475569;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #cbd5e1;
}

/* Tier Pricing */
.tier-pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.tier-pricing-card {
  background: linear-gradient(135deg, #f5f6fa 0%, #ffffff 100%);
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tier-pricing-card:hover {
  border-color: #ff5722;
  box-shadow: 0 4px 12px rgba(255, 87, 34, 0.1);
}

.tier-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a2e;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e2e8f0;
}

.tier-pricing-card .form-group {
  margin-bottom: 0;
}

.tier-pricing-card .form-control {
  font-size: 1.1rem;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
}

.tier-pricing-card .form-control:focus {
  border-color: #ff5722;
  box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.1);
}

/* New Form Grid*/
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 1.5rem;
}

.cs-btn-secondary {
  padding: 0.75rem 1.5rem;
  background: #e2e8f0;
  color: #333;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
}

.cs-btn-secondary:hover {
  background: #cbd5e1;
}

.error-text {
  color: #d32f2f;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  display: block;
}

/* Cars Grid */
.cars-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.car-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s;
}

.car-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.car-image {
  position: relative;
  height: 180px;
  background: #f0f0f0;
  overflow: hidden;
}

.car-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.car-image .placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  width: 100%;
  height: 100%;
}

.car-image .status-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: white;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.car-image .status-badge.available {
  color: #2e7d32;
}

.car-image .status-badge.unavailable {
  color: #d32f2f;
}

.car-info {
  padding: 1rem;
}

.car-info h4 {
  margin: 0 0 0.4rem 0;
  color: #1a1a2e;
  font-size: 1.1rem;
}

.car-info p {
  margin: 0 0 0.8rem 0;
  color: #666;
  font-size: 0.9rem;
}

.car-tier {
  margin-bottom: 1rem;
}

.car-actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.btn-delete {
  flex: 1;
  padding: 0.6rem;
  background: #ffebee;
  color: #d32f2f;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-delete:hover:not(:disabled) {
  background: #ffcdd2;
}

.btn-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-edit {
  flex: 1;
  padding: 0.6rem;
  background: #e3f2fd;
  color: #1976d2;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-edit:hover {
  background: #bbdefb;
}

/* Delete Confirmation Modal */
.btn-delete-confirm {
  padding: 0.6rem 1.2rem;
  background: #d32f2f;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-delete-confirm:hover {
  background: #b71c1c;
}

.warning {
  color: #d32f2f;
  font-weight: 600;
  margin-top: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-container {
    padding: 1rem;
  }
  
  .card-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .admin-table {
    font-size: 0.85rem;
  }
  
  .admin-table th,
  .admin-table td {
    padding: 0.75rem 0.5rem;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style>
