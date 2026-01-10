// ===== LinkMeU - Universal Listing Form JavaScript =====

// API Base URL - Change this when deploying
const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initializeForm();
    initializePhotoUpload();
    initializeDateDefaults();
    loadFeaturedListings();
    initializeCharCounter();
    checkAPIStatus();
});

// ===== Check API Status =====
async function checkAPIStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        if (data.status === 'ok') {
            console.log('✅ Connected to LinkMeU API');
        }
    } catch (error) {
        console.warn('⚠️ API not available. Running in demo mode.');
    }
}

// ===== Category Tabs =====
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const formHeader = document.querySelector('.form-header h1');

    const categoryTitles = {
        property: 'List Your Property',
        business: 'List Your Business',
        food: 'List Food & Beverage',
        products: 'List Your Product'
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active from all tabs
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });

            // Add active to clicked tab
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');

            // Update form header
            const category = tab.dataset.category;
            formHeader.textContent = categoryTitles[category];

            // Animation
            formHeader.style.animation = 'none';
            formHeader.offsetHeight; // Trigger reflow
            formHeader.style.animation = 'slideUp 0.3s ease-out';
        });
    });
}

// ===== Form Handling =====
function initializeForm() {
    const form = document.getElementById('listingForm');
    const submitBtn = document.getElementById('submitBtn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"/>
            </svg>
            Submitting to Database...
        `;

        try {
            // Collect form data
            const formData = collectFormData();

            // Collect photo data as base64
            const photoElements = document.querySelectorAll('.preview-item img');
            const photoData = Array.from(photoElements).map(img => img.src);

            // Send to backend API
            const response = await fetch(`${API_BASE_URL}/listings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    photoData: JSON.stringify(photoData)
                })
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ Listing saved to database:', result.listing);

                // Store WhatsApp link for modal
                window.currentWhatsAppLink = result.whatsappLink;

                // Show success modal
                showSuccessModal(result.listing.id);

                // Reload featured listings
                loadFeaturedListings();
            } else {
                throw new Error(result.message || 'Failed to save listing');
            }

        } catch (error) {
            console.error('Error submitting form:', error);

            // If API is not available, show demo success
            if (error.message.includes('Failed to fetch')) {
                console.log('📝 Demo mode: Form data collected locally');
                const formData = collectFormData();
                console.log('Form Data:', formData);
                showSuccessModal();
            } else {
                alert('Error: ' + error.message);
            }
        } finally {
            // Reset button
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 2L11 13"/>
                    <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
                Submit Listing to LinkMeU
            `;
        }
    });
}

function validateForm() {
    const form = document.getElementById('listingForm');
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('error');
            field.addEventListener('input', () => {
                field.classList.remove('error');
            }, { once: true });
        }

        // Check checkbox
        if (field.type === 'checkbox' && !field.checked) {
            isValid = false;
            field.closest('.checkbox-label').classList.add('error');
        }
    });

    if (!isValid) {
        // Scroll to first error
        const firstError = form.querySelector('.error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstError.focus();
        }
    }

    return isValid;
}

function collectFormData() {
    const form = document.getElementById('listingForm');
    const activeTab = document.querySelector('.tab-btn.active');

    return {
        category: activeTab.dataset.category,
        purpose: form.querySelector('input[name="purpose"]:checked').value,
        fromDate: form.fromDate.value,
        toDate: form.toDate.value,
        title: form.title.value,
        description: form.description.value,
        currency: form.currency.value,
        budget: form.budget.value,
        revenue: form.revenue.value,
        location: form.location.value,
        country: form.country.value,
        contact: form.contact.value,
        email: form.email.value,
        sellerName: form.sellerName.value,
        sellerType: form.sellerType.value,
        photos: Array.from(document.querySelectorAll('.preview-item img')).map(img => img.src),
        submittedAt: new Date().toISOString()
    };
}

// ===== Photo Upload =====
function initializePhotoUpload() {
    const uploadArea = document.getElementById('photoUploadArea');
    const fileInput = document.getElementById('photos');
    const previewContainer = document.getElementById('photoPreview');

    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    function handleFiles(files) {
        const maxFiles = 10;
        const currentFiles = previewContainer.querySelectorAll('.preview-item').length;

        Array.from(files).slice(0, maxFiles - currentFiles).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    addPreviewImage(e.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    function addPreviewImage(src) {
        const item = document.createElement('div');
        item.className = 'preview-item';
        item.innerHTML = `
            <img src="${src}" alt="Preview">
            <button type="button" class="preview-remove" onclick="removePreview(this)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;
        previewContainer.appendChild(item);

        // Animation
        item.style.animation = 'slideUp 0.3s ease-out';
    }
}

function removePreview(button) {
    const item = button.closest('.preview-item');
    item.style.opacity = '0';
    item.style.transform = 'scale(0.8)';
    setTimeout(() => item.remove(), 200);
}

// ===== Date Defaults =====
function initializeDateDefaults() {
    const fromDate = document.getElementById('fromDate');
    const toDate = document.getElementById('toDate');

    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    fromDate.setAttribute('min', today);
    toDate.setAttribute('min', today);

    // Set default from date to today
    fromDate.value = today;

    // Set default to date to 30 days from now
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    toDate.value = thirtyDaysLater.toISOString().split('T')[0];

    // Update min of toDate when fromDate changes
    fromDate.addEventListener('change', () => {
        toDate.setAttribute('min', fromDate.value);
        if (toDate.value < fromDate.value) {
            toDate.value = fromDate.value;
        }
    });
}

// ===== Character Counter =====
function initializeCharCounter() {
    const description = document.getElementById('description');
    const charCount = document.getElementById('charCount');

    description.addEventListener('input', () => {
        const count = description.value.length;
        charCount.textContent = count;

        if (count > 1500) {
            charCount.style.color = '#ef4444';
        } else if (count > 1200) {
            charCount.style.color = '#f59e0b';
        } else {
            charCount.style.color = '#a3a3a3';
        }
    });
}

// ===== Success Modal =====
function showSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.classList.add('active');

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('successModal');
    modal.classList.remove('active');

    // Reset form
    document.getElementById('listingForm').reset();
    document.getElementById('photoPreview').innerHTML = '';
    initializeDateDefaults();

    // Restore body scroll
    document.body.style.overflow = '';
}

// Close modal on overlay click
document.getElementById('successModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        closeModal();
    }
});

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// ===== Featured Listings =====
async function loadFeaturedListings() {
    const listingsGrid = document.getElementById('listingsGrid');

    // Category icons and labels
    const categoryIcons = {
        property: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`,
        business: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
        food: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/></svg>`,
        products: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/></svg>`
    };

    const categoryLabels = {
        property: 'Property',
        business: 'Business',
        food: 'Food & Beverage',
        products: 'Products'
    };

    const purposeLabels = {
        sale: 'For Sale',
        buy: 'Want to Buy',
        rent: 'For Rent',
        invest: 'Investment'
    };

    let listings = [];

    // Try to fetch from API
    try {
        const response = await fetch(`${API_BASE_URL}/listings?status=approved&limit=5`);
        const data = await response.json();

        if (data.success && data.listings.length > 0) {
            listings = data.listings.map((listing, index) => ({
                id: listing.id,
                category: listing.category,
                purpose: purposeLabels[listing.purpose] || listing.purpose,
                title: listing.title,
                price: `${listing.currency} ${listing.budget}`,
                location: `${listing.location}, ${listing.country}`,
                image: listing.photos && listing.photos.length > 0
                    ? listing.photos[0]
                    : `https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80`,
                featured: index === 0
            }));
            console.log('✅ Loaded listings from database');
        }
    } catch (error) {
        console.log('📝 Using demo listings (API not available)');
    }

    // Use demo listings if no data from API
    if (listings.length === 0) {
        listings = [
            {
                id: 1,
                category: 'property',
                purpose: 'For Sale',
                title: 'Luxury Villa with Pool',
                price: 'S$1,200,000',
                location: 'Sentosa, Singapore',
                image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80',
                featured: true
            },
            {
                id: 2,
                category: 'business',
                purpose: 'For Sale',
                title: 'Cozy Cafe in Orchard',
                price: 'S$120,000',
                location: 'Orchard, Singapore',
                image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80',
                featured: false
            },
            {
                id: 3,
                category: 'products',
                purpose: 'For Sale',
                title: 'Popular Restaurant Chain',
                price: 'S$250,000',
                location: 'Bugis, Singapore',
                image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
                featured: false
            },
            {
                id: 4,
                category: 'food',
                purpose: 'Investment',
                title: 'Popular Restaurant',
                price: 'S$250,000',
                location: 'Marina Bay',
                image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&q=80',
                featured: false
            },
            {
                id: 5,
                category: 'products',
                purpose: 'For Sale',
                title: 'Organic Skincare Brand',
                price: 'S$30 per set',
                location: 'Online',
                image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80',
                featured: false
            }
        ];
    }

    // Render listings
    const featured = listings.find(l => l.featured) || listings[0];
    let html = `
        <div class="listing-card featured" onclick="viewListing(${featured.id})">
            <div class="listing-image">
                <img src="${featured.image}" alt="${featured.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80'">
                <span class="listing-badge ${featured.category}">
                    ${categoryIcons[featured.category] || categoryIcons.property}
                    ${categoryLabels[featured.category] || 'Listing'}
                </span>
                <span class="listing-purpose">${featured.purpose}</span>
            </div>
            <div class="listing-content">
                <h3 class="listing-title">${featured.title}</h3>
                <p class="listing-price">${featured.price}</p>
                <div class="listing-meta">
                    <span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
                        ${featured.location}
                    </span>
                </div>
            </div>
        </div>
    `;

    // Small listings grid
    const smallListings = listings.filter(l => !l.featured || l.id !== featured.id).slice(0, 4);
    if (smallListings.length > 0) {
        html += '<div class="listings-small">';
        smallListings.forEach(listing => {
            html += `
                <div class="listing-card small" onclick="viewListing(${listing.id})">
                    <div class="listing-image">
                        <img src="${listing.image}" alt="${listing.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80'">
                        <span class="listing-badge ${listing.category}">
                            ${categoryIcons[listing.category] || categoryIcons.property}
                            ${categoryLabels[listing.category] || 'Listing'}
                        </span>
                    </div>
                    <div class="listing-content">
                        <h3 class="listing-title">${listing.title}</h3>
                        <p class="listing-price">${listing.price}</p>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }

    listingsGrid.innerHTML = html;
}

function viewListing(id) {
    // In production, navigate to listing detail page
    console.log('View listing:', id);
    alert(`Viewing listing #${id}\n\nIn production, this would navigate to the listing detail page.`);
}

// ===== Format Currency Input =====
document.getElementById('budget').addEventListener('input', function (e) {
    let value = e.target.value.replace(/[^\d.]/g, '');
    if (value) {
        const parts = value.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        e.target.value = parts.join('.');
    }
});

// ===== Phone Number Formatting =====
document.getElementById('contact').addEventListener('input', function (e) {
    let value = e.target.value.replace(/[^\d+\s-]/g, '');
    e.target.value = value;
});

// ===== Export for global access =====
window.removePreview = removePreview;
window.closeModal = closeModal;
window.viewListing = viewListing;
