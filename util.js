var connection = datacash.connect('https://api.bitindex.network');
var balance = function(addr) {
  var legacyAddr = bchaddr.toLegacyAddress(addr)
  var cashAddr = bchaddr.toCashAddress(addr)
  return new Promise(function(resolve, reject) {
    connection.getUnspentUtxos(legacyAddr, function(err, utxos) {
      if (err) {
        console.log("Error: ", err)
      } else {
        var sats = utxos.map(function(output) {
          return output.satoshis
        }).reduce(function(acc, sat) {
          return sat + acc;
        }, 0)
        resolve({
          val: sats,
          addr: cashAddr
        })
      }
    });
  })
}
var rate = function(currency) {
  return fetch("https://bitcoinsv-rates.com/api/rates/"+currency)
  .then(function(res) {
    return res.json()
  }).then(function(res) {
    return res.value;
  })
}
var convert = function(balance, rate) {
  var converted = balance * rate / 100000000;
  return new Intl.NumberFormat(global_locale, { style: 'currency', currency: global_currency }).format(converted);
}
var comma = function(balance) {
  return new Intl.NumberFormat().format(balance);
}
var qr = function(data) {
  var q = qrcode(4, 'L');
  q.addData(data);
  q.make();
  return q.createImgTag(4);
}
var isClickable = function(el) {
  if (el && (el.nodeName === 'BUTTON' || el.nodeName === 'A')) {
    return true;
  } else {
    return false;
  }
}
