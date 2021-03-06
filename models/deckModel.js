const admin = require('../config/firestore-config');
const uuidv4 = require('uuid/v4');

module.exports = {
  getDeckInfo,
  getCards,
  postCards,
  getListOfDecks,
  deleteCards,
  deleteDeckInfo,
  editCard,
  getCard,
  updateDeckName,
  archiveDeck,
  unArchiveDeck,
  deleteArchivedInfo,
  deleteArchivedCards,
  getArchivedInfo,
  getArchivedCards,
  postArchivedCards,
  getListOfArchivedDecks
};
// Firestore is organized into documents and collections. Documents are where all of the data is actually going to be stored in key-value pairs. Collections contain many documents within them. Starting at the highest level there is always a collection. For much of what we have that is going to be 'Users'. We do also have a 'DemoDeck' collection, but that is only for the demo decks. Within that collection can be any number of documents. So 'Users' has many different user documents within them; these user documents contain information about the user that they provided on the preferences page within the app. We could also store any additional information about the user here. Documents can also have sub-collections. If you look in Firestore you will see that each user has a 'UserInformation' sub-collection. That exists so that we can have the 'Decks' and 'Archives' documents. You will see on both of those documents that they have a key-value pair of {obj: 'created'}; that is because to create a document within Firestore you have to pass in some fields for it to have. This key-value pair doesn't mean anything in particular and you can ignore it, it's just there to create the document. 'Archives' and 'Decks' are set up identically; 'Archives' is for archived decks and 'Decks' is for live decks. Each deck is a sub-collection' that is currently set to the deck's name. That is something that will need to be updated eventually. Each deck sub-collection has a document within it that is called 'DeckInformation'; it contains all of the information that we are storing for that deck such as its length, its icons and tags, who created it, etc. That document has a sub-collection called 'Cards' which houses each of the cards in the deck in its own document. The card documents have their ids generated by uuid and have fields for front, back, and archived. Once you get the generally idea of how Firestore is set up navigating through each of the functions isn't too bad. We'll go through a few of the key words for Firestore to help get you started. We have already covered what a collection and a document (or doc) is so we will get into the various methods available starting with .get(). It functions largely how you would expect it to in that it retrieves the collection or document that you tell it to; you will have to manipulate what it returns a bit to have the actual data available and to see that take a look at deckRoutes.js. You will also see .set() used quite frequently. This method is used to create or update a document. It 'sets' the document to be equal to whatever object you pass to it. If it doesn't already exist it will create it and if it does exist it will overwrite what was there. There is also .update(). This will update the specified field within a document while leaving the rest unchanged. .delete() will delete the specified object or collection. .listCollections() will list all of the sub-collections of a document. Batch is a little different. It allows you to make a group of up to 100 .set(), .update(), or .delete() calls and call them all at once. Basically you use it when you want to update, create, or delete a lot of documents in one operation. It does count each operation the same as if you had called them individually though so it's not very different from just looping through everything on your own and making a lot of individual calls. Batch is also limited to 500 operations per batch. That should help you get started on Firestore; there are a lot of quirks and nuances with it. For example, one thing we found was that Firestore will happily return empty objects for a deck of cards that doesn't exist and result in a 200 response. There could be some more validating built into the back end to prevent that but we chose to try to prevent such issues from arising on the front end.

// Gets deck information
function getDeckInfo(id, colId) {
  return admin.db
    .collection('Users')
    .doc(id)
    .collection('UserInformation')
    .doc('Decks')
    .collection(colId)
    .get();
}

function getArchivedInfo(id, colId) {
  return admin.db
    .collection('Users')
    .doc(id)
    .collection('UserInformation')
    .doc('Archives')
    .collection(colId)
    .get();
}

// returns cards by user and deck id
function getCards(id, colId) {
  return admin.db
    .collection('Users')
    .doc(id)
    .collection('UserInformation')
    .doc('Decks')
    .collection(colId)
    .doc('DeckInformation')
    .collection('Cards')
    .get();
}

function getArchivedCards(id, colId) {
  return admin.db
    .collection('Users')
    .doc(id)
    .collection('UserInformation')
    .doc('Archives')
    .collection(colId)
    .doc('DeckInformation')
    .collection('Cards')
    .get();
}

// adds cards to a deck by user id and deck id
function postCards(uid, colId, cards) {
  let batch = admin.db.batch();

  cards.forEach(card => {
    const deck = admin.db
      .collection('Users')
      .doc(uid)
      .collection('UserInformation')
      .doc('Decks')
      .collection(colId)
      .doc('DeckInformation')
      .collection('Cards')
      .doc(`${uuidv4()}`);

    batch.set(deck, {
      front: card.front,
      back: card.back,
      archived: false
    });
  });
  return batch.commit();
}

function postArchivedCards(uid, colId, cards) {
  let batch = admin.db.batch();

  cards.forEach(card => {
    const deck = admin.db
      .collection('Users')
      .doc(uid)
      .collection('UserInformation')
      .doc('Decks')
      .collection(colId)
      .doc('DeckInformation')
      .collection('Cards')
      .doc(card.id);

    batch.set(deck, {
      front: card.front,
      back: card.back,
      archived: card.archived
    });
  });
  return batch.commit();
}

// gets list of decks by user id
function getListOfDecks(id) {
  return admin.db
    .collection('Users')
    .doc(id)
    .collection('UserInformation')
    .doc('Decks')
    .listCollections();
}

function getListOfArchivedDecks(id) {
  return admin.db
    .collection('Users')
    .doc(id)
    .collection('UserInformation')
    .doc('Archives')
    .listCollections();
}

// deletes specified cards from a deck by deck id and user id
function deleteCards(uid, colId, cards) {
  let batch = admin.db.batch();

  cards.forEach(card => {
    const cards = admin.db
      .collection('Users')
      .doc(uid)
      .collection('UserInformation')
      .doc('Decks')
      .collection(colId)
      .doc('DeckInformation')
      .collection('Cards')
      .doc(card.id);

    batch.delete(cards);
  });

  return batch.commit();
}

function deleteArchivedCards(uid, colId, cards) {
  let batch = admin.db.batch();

  cards.forEach(card => {
    const cards = admin.db
      .collection('Users')
      .doc(uid)
      .collection('UserInformation')
      .doc('Archives')
      .collection(colId)
      .doc('DeckInformation')
      .collection('Cards')
      .doc(card.id);

    batch.delete(cards);
  });

  return batch.commit();
}
// removes the deck information from a deck by deck id and user id
function deleteDeckInfo(uid, colId) {
  return admin.db
    .collection('Users')
    .doc(uid)
    .collection('UserInformation')
    .doc('Decks')
    .collection(colId)
    .doc('DeckInformation')
    .delete();
}

function deleteArchivedInfo(uid, colId) {
  return admin.db
    .collection('Users')
    .doc(uid)
    .collection('UserInformation')
    .doc('Archives')
    .collection(colId)
    .doc('DeckInformation')
    .delete();
}

// updates the name of a deck in the deckInformation doc by user id and deck id
function updateDeckName(uid, colId, changes) {
  return admin.db
    .collection('Users')
    .doc(uid)
    .collection('UserInformation')
    .doc('Decks')
    .collection(colId)
    .doc('DeckInformation')
    .update({ deckName: changes.deckName });
}

// edits a card by user id and deck id. expects an array of cards
function editCard(uid, colId, changes) {
  let batch = admin.db.batch();

  changes.forEach(card => {
    const cards = admin.db
      .collection('Users')
      .doc(uid)
      .collection('UserInformation')
      .doc('Decks')
      .collection(colId)
      .doc('DeckInformation')
      .collection('Cards')
      .doc(card.id);

    batch.set(cards, {
      front: card.front,
      back: card.back,
      archived: card.archived
    });
  });

  return batch.commit();
}

// gets an individual card by user id, deck id, and card id
function getCard(uid, colId, docId) {
  return admin.db
    .collection('Users')
    .doc(uid)
    .collection('UserInformation')
    .doc('Decks')
    .collection(colId)
    .doc('DeckInformation')
    .collection('Cards')
    .doc(docId)
    .get();
}

function archiveDeck(uid, colId, cards) {
  let batch = admin.db.batch();

  cards.forEach(card => {
    const deck = admin.db
      .collection('Users')
      .doc(uid)
      .collection('UserInformation')
      .doc('Archives')
      .collection(colId)
      .doc('DeckInformation')
      .collection('Cards')
      .doc(card.id);
    batch.set(deck, {
      front: card.front,
      back: card.back,
      archived: card.archived
    });
  });
  return batch.commit();
}

function unArchiveDeck(uid, colId, cards) {
  let batch = admin.db.batch();

  cards.forEach(card => {
    const deck = admin.db
      .collection('Users')
      .doc(uid)
      .collection('UserInformation')
      .doc('Decks')
      .collection(colId)
      .doc('DeckInformation')
      .collection('Cards')
      .doc(card.id);
    batch.set(deck, {
      front: card.front,
      back: card.back
    });
  });
  return batch.commit();
}
