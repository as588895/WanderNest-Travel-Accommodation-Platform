//    mapboxgl.accessToken = mapToken;

//     const map = new mapboxgl.Map({
//         container: "map", // container ID
//         style: "mapbox://styles/mapbox/streets-v12", // style URL
//         center:listing.geometry.coordinates, // starting position [longitude, latitude]. Note that lat must be set between -90 and 90
//         zoom: 9 // starting zoom
//     });

//     const marker = new mapboxgl.Marker({ color: "red" })
//         .setLngLat(listing.geometry.coordinates)  //Listing.geometry.coordinates
//         .setPopup(
//             new mapboxgl.Popup({ offset: 25 }).setHTML(
//                 `<h4>${listing.title}</h4><p>Exact Location provided after booking</p>`)) // add listing title and description to the popup
//         .addTo(map);


console.log("Geometry:", listing.geometry);

if (
    listing.geometry &&
    listing.geometry.coordinates &&
    listing.geometry.coordinates.length === 2
) {
    mapboxgl.accessToken = mapToken;

    const map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/streets-v12",  //dark-v11
        center: listing.geometry.coordinates,
        zoom: 9
    });

    const marker = new mapboxgl.Marker({ color: "red" })
        .setLngLat(listing.geometry.coordinates)
        .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
                `<h4>${listing.title}</h4>
                 <p>Exact Location provided after booking</p>`
            )
        )
        .addTo(map);

 } // else {
//     document.getElementById("map").innerHTML =
//         "<p style='padding:20px'>Location data not available for this listing.</p>";
// }