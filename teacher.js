
const tEmail = document.getElementById('t-email');
const tPassword = document.getElementById('t-password');
const tName = document.getElementById('t-name');
const tSignup = document.getElementById('t-signup');
const tSignin = document.getElementById('t-signin');
const tSignout = document.getElementById('t-signout');
const tCurrent = document.getElementById('t-current');

const sessionArea = document.getElementById('session-area');
const generateBtn = document.getElementById('generate-qr');
const qrcodeDiv = document.getElementById('qrcode');
const sessionIdEl = document.getElementById('session-id');
const classNameInput = document.getElementById('class-name');
const attendanceList = document.getElementById('attendance-list');

tSignup.onclick = () => {
  signUp(tEmail.value, tPassword.value, 'teacher', tName.value)
    .then(() => alert('Teacher account created.'))
    .catch(err => alert(err.message));
};

tSignin.onclick = () => signIn(tEmail.value, tPassword.value)
  .catch(err => alert(err.message));

tSignout.onclick = () => signOut();

auth.onAuthStateChanged(async user => {
  if (!user) {
    tCurrent.innerText = 'Not signed in';
    sessionArea.style.display = 'none';
    qrcodeDiv.innerHTML = '';
    sessionIdEl.innerText = '';
    attendanceList.innerHTML = '';
    return;
  }

  const userDoc = await getCurrentUserDoc();
  tCurrent.innerText = `Signed in as ${user.email} (${userDoc.displayName || ''}) role: ${userDoc.role}`;
  if (userDoc.role === 'teacher') sessionArea.style.display = 'block';
});

function generateSessionId() {
  return 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2,8);
}

let currentSessionId = null;
let unsubscribeAttendance = null;

generateBtn.onclick = async () => {
  const cls = classNameInput.value || 'Class';
  const teacher = auth.currentUser;
  if (!teacher) return alert('Sign in first');

  const sessionId = generateSessionId();
  currentSessionId = sessionId;


  await db.collection('sessions').doc(sessionId).set({
    sessionId,
    className: cls,
    teacherId: teacher.uid,
    teacherEmail: teacher.email,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  
  const payload = { sessionId };
  qrcodeDiv.innerHTML = '';
  new QRCode(qrcodeDiv, {
    text: JSON.stringify(payload),
    width: 240,
    height: 240
  });

  sessionIdEl.innerText = sessionId;
  listenAttendance(sessionId);
};


function listenAttendance(sessionId) {
  if (unsubscribeAttendance) unsubscribeAttendance();

  attendanceList.innerHTML = '<p>Loading...</p>';
  unsubscribeAttendance = db.collection('sessions').doc(sessionId)
    .collection('attendants')
    .orderBy('timestamp', 'asc')
    .onSnapshot(snap => {
      let html = '<ul>';
      snap.forEach(doc => {
        const d = doc.data();
        const name = d.displayName || d.email || 'Unknown';
        const ts = d.timestamp ? d.timestamp.toDate().toLocaleString() : '';
        html += `<li>${name} — ${ts}</li>`;
      });
      html += '</ul>';
      attendanceList.innerHTML = html;
    });
}
