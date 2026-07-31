const fs = require("fs");

const file = "./database/requests.json";

function clearRequests() {
    fs.writeFileSync(
        "requests.json",
        JSON.stringify([], null, 2)
    );

    return true;
}


// Get database
function getDatabase() {

    if (!fs.existsSync(file)) {

        return {
            lastRequest: 0,
            requests: []
        };

    }


    try {

        return JSON.parse(
            fs.readFileSync(file, "utf8")
        );

    } catch (error) {

        return {
            lastRequest: 0,
            requests: []
        };

    }

}



// Save database
function saveDatabase(data) {

    fs.writeFileSync(
        file,
        JSON.stringify(data, null, 2)
    );

}



// Create new request
function createRequest(requestData) {

    const data = getDatabase();


    data.lastRequest++;


    const requestID = String(
        data.lastRequest
    ).padStart(4, "0");



    const newRequest = {

        id: requestID,

        ...requestData,

        status: "Pending",

        created: new Date().toISOString()

    };



    data.requests.push(newRequest);


    saveDatabase(data);



    return requestID;

}



// Find one request
function getRequest(id) {

    const data = getDatabase();


    return data.requests.find(
        request => request.id === id
    );

}



// Cancel request
function cancelRequest(id) {

    const data = getDatabase();


    const request = data.requests.find(
        request => request.id === id
    );


    if (!request) {

        return null;

    }



    request.status = "Cancelled";


    saveDatabase(data);



    return request;

}



// Get all requests
function getAllRequests() {

    const data = getDatabase();


    return data.requests;

}



module.exports = {
    createRequest,
    cancelRequest,
    getAllRequests,
    clearRequests
};