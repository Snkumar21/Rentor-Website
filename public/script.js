document.getElementById('postForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const propertyType = document.getElementById('propertyType').value;
    const location = document.getElementById('location').value;
    const priceRange = document.getElementById('priceRange').value;
    const description = document.getElementById('description').value;
    
    const postMessage = document.createElement('div');
    postMessage.innerHTML = `
        <h3>${propertyType} in ${location}</h3>
        <p>Price Range: ${priceRange}</p>
        <p>${description}</p>
    `;
    
    document.getElementById('postMessages').appendChild(postMessage);
    
    document.getElementById('postForm').reset();
});

function searchProperties() {
    const searchInput = document.getElementById('searchInput').value;
    const searchResults = document.getElementById('searchResults');
    
    searchResults.innerHTML = `<p>Searching for properties related to "${searchInput}"...</p>`;
}
