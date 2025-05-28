// models/Address.js
const addressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isDefault: { type: Boolean, default: false },
  type: { type: String, enum: ['home', 'work', 'other'] },
  street: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  phone: String,
  instructions: String
}, { timestamps: true });

// In your frontend
async function loadSavedAddresses() {
  try {
    const response = await secureFetch('/api/addresses');
    if (!response.ok) throw new Error('Failed to load addresses');
    
    const { data } = await response.json();
    renderAddresses(data);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function renderAddresses(addresses) {
  const container = document.getElementById('savedAddresses');
  container.innerHTML = addresses.map(addr => `
    <div class="address-card" data-address-id="${addr._id}">
      <h4>${addr.type} ${addr.isDefault ? '(Default)' : ''}</h4>
      <p>${addr.street}</p>
      <p>${addr.city}, ${addr.postalCode}</p>
      <p>${addr.country}</p>
      ${addr.phone ? `<p>Phone: ${addr.phone}</p>` : ''}
      <button class="btn-select-address">Select</button>
    </div>
  `).join('');
  
  // Add event listeners
  document.querySelectorAll('.btn-select-address').forEach(btn => {
    btn.addEventListener('click', function() {
      const addressId = this.closest('.address-card').dataset.addressId;
      selectAddress(addressId);
    });
  });
}