const sEmail = document.getElementById('s-email');
const sPassword = document.getElementById('s-password');
const sName = document.getElementById('s-name');
const sSignup = document.getElementById('s-signup');
const sSignin = document.getElementById('s-signin');
const sSignout = document.getElementById('s-signout');
const sCurrent = document.getElementById('s-current');

const scanArea = document.getElementById('scan-area');
const qrReaderDiv = document.getElementById('qr-reader');
const scanResult = document.getElementById('scan-result');
const startScanBtn = document.getElementById('start-scan');

let html5QrcodeScanner = null;

// ----- Auth buttons -----
sSignup.onclick = () => {
  signUp(sEmail.value, sPassword.value, 'student', sName.value)
    .then(() => alert('Student account created.'))
    .catch(err => alert(err.message));
};

sSignin.onclick = () => signIn(sEmail.value, sPassword.value)
  .catch(err => alert(err.message));

sSignout.onclick = () => signOut();

// ----- Update UI on auth change -----
auth.onAuthStateChanged(async user => {
  if (!user) {
    sCurrent.innerText = 'Not signed in';
    scanArea.style.display = 'none';
    stopScanner();
    return;
  }

  const userDoc = await getCurrentUserDoc();
  sCurrent.innerText = `Signed in as ${user.email} (${userDoc.displayName || ''})`;
  if (userDoc.role === 'student') {
    scanArea.style.display = 'block';
  } else {
    scanArea.style.display = 'none';
    stopScanner();
  }
});

// ----- Start camera when button clicked -----
startScanBtn.onclick = startScanner;

// ----- QR scanner functions -----
function startScanner() {
  if (html5QrcodeScanner) return;

  html5QrcodeScanner = new Html5Qrcode("qr-reader");

  Html5Qrcode.getCameras().then(cameras => {
    if (cameras && cameras.length) {
      // pick back camera if available
      const camera = cameras.find(cam => cam.label.toLowerCase().includes('back')) || cameras[0];
      html5QrcodeScanner.start(
        camera.id,
        { fps: 10, qrbox: 250 },
        qrCodeSuccessCallback,
        qrCodeErrorCallback
      ).catch(err => {
        scanResult.innerText = 'Cannot start camera: ' + err;
      });
    } else {
      scanResult.innerText = 'No camera found';
    }
  }).catch(err => {
    scanResult.innerText = 'Error getting cameras: ' + err;
  });
}

function stopScanner() {
  if (!html5QrcodeScanner) return;
  html5QrcodeScanner.stop().then(() => {
    html5QrcodeScanner.clear();
    html5QrcodeScanner = null;
  });
}

function qrCodeErrorCallback(err) {
  // ignore minor scan errors
}

async function qrCodeSuccessCallback(decodedText) {
  stopScanner();

  let payload;
  try {
    payload = JSON.parse(decodedText);
  } catch {
    scanResult.innerText = 'Invalid QR code';
    return;
  }

  const sessionId = payload.sessionId;
  if (!sessionId) {
    scanResult.innerText = 'Session ID missing';
    return;
  }

  const user = auth.currentUser;
  const userDoc = await getCurrentUserDoc();
  const attRef = db.collection('sessions').doc(sessionId).collection('attendants').doc(user.uid);
  const attSnap = await attRef.get();

  if (attSnap.exists) {
    scanResult.innerText = 'Already marked attendance ✅';
  } else {
    await attRef.set({
      studentId: user.uid,
      email: user.email,
      displayName: userDoc.displayName || '',
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    scanResult.innerText = 'Attendance recorded ✅';
  }
}
