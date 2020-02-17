'use strict';

(function () {

  var DATA_LOADING_RESOURСE = 'https://js.dump.academy/keksobooking/data';
  var LEFT_BUTTON_MOUSE_UP_CODE = 0;
  var MARGIN_TOP = 65;
  var MAX_HEIGHT_AREA = 500;
  var HORIZONTAL_MARGIN = 0;
  var HALF = 0.5;
  var PIN_LIMIT = 5;
  var map = window.general.map;
  var pinsFromServer;
  var mapFiltersBlock = map.querySelector('.map__filters');
  var mapFilters = mapFiltersBlock.querySelectorAll(':scope > *');
  var mapPins = map.querySelector('.map__pins');
  var mainPin = map.querySelector('.map__pin--main');
  var mainPinWidthHalf = mainPin.offsetWidth / 2;
  var mainPinHeight = mainPin.offsetHeight;

  var priceCostsMap = {
    low: [-Infinity, 10000],
    middle: [10000, 50000],
    high: [50000, Infinity]
  };

  var mainPinPointer = {
    x: Math.round(mainPin.offsetLeft + mainPinWidthHalf),
    y: Math.round(mainPin.offsetTop + mainPinHeight)
  };

  var borderArea = {
    top: MARGIN_TOP,
    right: map.clientWidth - mainPin.offsetWidth * HALF,
    bottom: MARGIN_TOP + MAX_HEIGHT_AREA,
    left: HORIZONTAL_MARGIN - mainPin.offsetWidth * HALF
  };
  window.moveElement.addDragAndDrop(mainPin, mainPin, borderArea);

  var setFiltersEnabled = function () {

    mapFilters.forEach(function (item) {
      item.removeAttribute('disabled');
    });
  };

  var setFiltersDisabled = function () {
    mapFilters.forEach(function (item) {
      item.setAttribute('disabled', '');
    });
    mapFiltersBlock.reset();
  };

  var addPins = function (pinData) {
    var elementAfterCard = map.querySelector('.map__filters-container');
    var fragmentToAdd = window.pins.returnFragmentWithPins(pinData, map, elementAfterCard);
    mapPins.appendChild(fragmentToAdd);
  };

  var getPinsFromServer = function (pinData) {
    pinsFromServer = pinData.slice();
    setFiltersEnabled();
    addPins(pinsFromServer.slice(0, PIN_LIMIT));
  };

  var pinsAddFilter = function (formData) {
    var typeFilter = formData.get('housing-type');
    var priceFilter = formData.get('housing-price');
    var roomsFilter = formData.get('housing-rooms');
    var guestsFilter = formData.get('housing-guests');
    var featuresFilter = formData.getAll('features');
    var offer;

    var result = [];
    for (var i = 0; i < pinsFromServer.length && result.length < PIN_LIMIT; i++) {
      offer = pinsFromServer[i].offer;
      if (typeFilter !== 'any' && offer.type !== typeFilter) {
        continue;
      }

      if (priceFilter !== 'any' && !(priceCostsMap[priceFilter][0] <= offer.price && offer.price < priceCostsMap[priceFilter][1])) {
        continue;
      }
      if (roomsFilter !== 'any' && offer.rooms !== +roomsFilter) {
        continue;
      }
      if ((guestsFilter !== 'any' && offer.guests < guestsFilter) || (offer.guests !== guestsFilter && guestsFilter === '0')) {
        continue;
      }
      if (featuresFilter !== []) {
        var notFindedElements = featuresFilter.filter(function (item) {
          return offer.features.indexOf(item) === -1;
        });
        if (notFindedElements.length) {
          continue;
        }
      }
      result.push(pinsFromServer[i]);
    }
    window.pins.deleteAll();
    addPins(result);
  };

  var setDisabled = function () {
    map.classList.add('map--faded');
    pinsFromServer = null;
    setFiltersDisabled();
    window.pins.deleteAll();
  };

  var setEnabled = function () {
    map.classList.remove('map--faded');
    window.serverRequest.load(DATA_LOADING_RESOURСE, getPinsFromServer, window.dialog.onError);
  };

  var addEventsWithCallback = function (onMainPinClickCallback, onMainPinMouseUpCallback) {

    mainPin.addEventListener('mousedown', function (evt) {
      if (evt.buttons === window.general.LEFT_MOUSE_BUTTON) {
        onMainPinClickCallback();

        var onMainPinMouseUp = function () {
          if (evt.button === LEFT_BUTTON_MOUSE_UP_CODE) {
            mainPinPointer.x = Math.round(mainPin.offsetLeft + mainPinWidthHalf);
            mainPinPointer.y = Math.round(mainPin.offsetTop + mainPinHeight);
          }
          onMainPinMouseUpCallback();
          document.removeEventListener('mouseup', onMainPinMouseUp);
        };
        document.addEventListener('mouseup', onMainPinMouseUp);
      }
    });

    mainPin.addEventListener('keydown', function (evt) {
      if (evt.key === window.general.ENTER_KEY) {
        onMainPinClickCallback();
      }
    });
  };

  mapFiltersBlock.addEventListener('change', function () {
    pinsAddFilter(new FormData(mapFiltersBlock));
  });

  window.map = {
    addPins: addPins,
    addEventsWithCallback: addEventsWithCallback,
    mainPinPointer: mainPinPointer,
    setEnabled: setEnabled,
    setDisabled: setDisabled
  };

})();
