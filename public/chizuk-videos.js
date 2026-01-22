import { auth, db, collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, doc, deleteDoc, updateDoc, increment, onSnapshot } from './firebase-config.js';

let currentUser = null;
let videosUnsubscribe = null;

// Initialize Chizuk Videos
export function initChizukVideos(user) {
    currentUser = user;
    
    // Setup event listeners
    setupChizukListeners();
    
    // Load videos
    loadVideos();
}

function setupChizukListeners() {
    // Add video form
    const addVideoForm = document.getElementById('addVideoForm');
    if (addVideoForm) {
        addVideoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await addVideo();
        });
    }
    
    // Filter category
    const filterCategory = document.getElementById('filterCategory');
    if (filterCategory) {
        filterCategory.addEventListener('change', loadVideos);
    }
    
    // Sort videos
    const sortVideos = document.getElementById('sortVideos');
    if (sortVideos) {
        sortVideos.addEventListener('change', loadVideos);
    }
}

// Extract YouTube video ID from URL
function getYouTubeVideoId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

// Add new video
async function addVideo() {
    const urlInput = document.getElementById('videoUrl');
    const titleInput = document.getElementById('videoTitle');
    const descriptionInput = document.getElementById('videoDescription');
    const categoryInput = document.getElementById('videoCategory');
    
    const url = urlInput.value.trim();
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const category = categoryInput.value;
    
    if (!url || !title || !category) {
        alert('Please fill in all required fields!');
        return;
    }
    
    // Extract YouTube video ID
    const videoId = getYouTubeVideoId(url);
    if (!videoId) {
        alert('Invalid YouTube URL. Please use a valid YouTube video link.');
        return;
    }
    
    try {
        await addDoc(collection(db, 'chizukVideos'), {
            videoId: videoId,
            url: url,
            title: title,
            description: description,
            category: category,
            uploadedBy: currentUser.id,
            uploaderName: currentUser.name,
            timestamp: serverTimestamp(),
            views: 0,
            likes: 0
        });
        
        // Clear form
        urlInput.value = '';
        titleInput.value = '';
        descriptionInput.value = '';
        categoryInput.value = '';
        
        alert('✅ Shiur added successfully!');
        
    } catch (error) {
        console.error('Error adding video:', error);
        alert('Failed to add video. Please try again.');
    }
}

// Load videos
async function loadVideos() {
    const videosGrid = document.getElementById('videosGrid');
    if (!videosGrid) return;
    
    const filterCategory = document.getElementById('filterCategory')?.value || 'all';
    const sortBy = document.getElementById('sortVideos')?.value || 'recent';
    
    try {
        // Unsubscribe from previous listener
        if (videosUnsubscribe) {
            videosUnsubscribe();
        }
        
        // Build query
        let q;
        if (filterCategory === 'all') {
            if (sortBy === 'recent') {
                q = query(collection(db, 'chizukVideos'), orderBy('timestamp', 'desc'));
            } else if (sortBy === 'popular') {
                q = query(collection(db, 'chizukVideos'), orderBy('views', 'desc'));
            } else {
                q = query(collection(db, 'chizukVideos'), orderBy('title', 'asc'));
            }
        } else {
            if (sortBy === 'recent') {
                q = query(collection(db, 'chizukVideos'), 
                    where('category', '==', filterCategory), 
                    orderBy('timestamp', 'desc'));
            } else if (sortBy === 'popular') {
                q = query(collection(db, 'chizukVideos'), 
                    where('category', '==', filterCategory), 
                    orderBy('views', 'desc'));
            } else {
                q = query(collection(db, 'chizukVideos'), 
                    where('category', '==', filterCategory), 
                    orderBy('title', 'asc'));
            }
        }
        
        // Real-time listener
        videosUnsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                videosGrid.innerHTML = `
                    <div class="empty-state">
                        <p>No shiurim found in this category.</p>
                        <p>💡 Be the first to share!</p>
                    </div>
                `;
                return;
            }
            
            videosGrid.innerHTML = '';
            
            snapshot.forEach((doc) => {
                const video = { id: doc.id, ...doc.data() };
                const videoCard = createVideoCard(video);
                videosGrid.appendChild(videoCard);
            });
        });
        
    } catch (error) {
        console.error('Error loading videos:', error);
        videosGrid.innerHTML = `
            <div class="empty-state">
                <p>Error loading videos. Please try again.</p>
            </div>
        `;
    }
}

// Create video card
function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    
    const isOwner = currentUser && video.uploadedBy === currentUser.id;
    const categoryLabels = {
        'general': 'General',
        'laws': 'Laws & Halachos',
        'stories': 'Stories',
        'mussar': 'Mussar',
        'chofetz-chaim': 'Chofetz Chaim',
        'practical': 'Practical'
    };
    
    const timeAgo = video.timestamp?.toDate ? getTimeAgo(video.timestamp.toDate()) : 'Recently';
    
    card.innerHTML = `
        <div class="video-thumbnail" data-video-id="${video.videoId}">
            <img src="https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg" alt="${escapeHtml(video.title)}">
            <div class="play-overlay">
                <div class="play-button">▶</div>
            </div>
        </div>
        <div class="video-info">
            <h5 class="video-title">${escapeHtml(video.title)}</h5>
            <p class="video-category">📚 ${categoryLabels[video.category] || video.category}</p>
            ${video.description ? `<p class="video-description">${escapeHtml(video.description)}</p>` : ''}
            <div class="video-meta">
                <span class="video-uploader">👤 ${escapeHtml(video.uploaderName)}</span>
                <span class="video-time">⏱️ ${timeAgo}</span>
                <span class="video-views">👁️ ${video.views || 0} views</span>
            </div>
            <div class="video-actions">
                <button class="video-action-btn watch-btn" onclick="watchVideo('${video.videoId}', '${video.id}')">
                    📺 Watch
                </button>
                ${isOwner ? `
                    <button class="video-action-btn delete-btn" onclick="deleteVideo('${video.id}')">
                        🗑️ Delete
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    return card;
}

// Watch video
window.watchVideo = async function(videoId, docId) {
    // Increment view count
    try {
        await updateDoc(doc(db, 'chizukVideos', docId), {
            views: increment(1)
        });
    } catch (error) {
        console.error('Error updating views:', error);
    }
    
    // Open in modal
    showVideoModal(videoId);
};

// Show video in modal
function showVideoModal(videoId) {
    // Create modal if doesn't exist
    let modal = document.getElementById('videoModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'videoModal';
        modal.className = 'video-modal';
        modal.innerHTML = `
            <div class="video-modal-overlay"></div>
            <div class="video-modal-content">
                <button class="video-modal-close">&times;</button>
                <div class="video-player-container">
                    <iframe id="videoPlayer" 
                        width="100%" 
                        height="100%" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close button
        modal.querySelector('.video-modal-close').addEventListener('click', closeVideoModal);
        modal.querySelector('.video-modal-overlay').addEventListener('click', closeVideoModal);
    }
    
    // Set video source
    const player = document.getElementById('videoPlayer');
    player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    
    // Show modal
    modal.style.display = 'flex';
}

// Close video modal
function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    if (modal) {
        const player = document.getElementById('videoPlayer');
        player.src = '';
        modal.style.display = 'none';
    }
}

// Delete video
window.deleteVideo = async function(videoId) {
    const confirmed = confirm('Are you sure you want to delete this shiur?');
    if (!confirmed) return;
    
    try {
        await deleteDoc(doc(db, 'chizukVideos', videoId));
        alert('✅ Shiur deleted successfully!');
    } catch (error) {
        console.error('Error deleting video:', error);
        alert('Failed to delete video. Please try again.');
    }
};

// Get time ago string
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + ' year' + (interval > 1 ? 's' : '') + ' ago';
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + ' month' + (interval > 1 ? 's' : '') + ' ago';
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + ' day' + (interval > 1 ? 's' : '') + ' ago';
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + ' hour' + (interval > 1 ? 's' : '') + ' ago';
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + ' minute' + (interval > 1 ? 's' : '') + ' ago';
    
    return 'Just now';
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
