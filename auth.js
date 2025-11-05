function signUp(email, password, role, displayName){
  return auth.createUserWithEmailAndPassword(email, password)
    .then(cred => cred.user.updateProfile({displayName: displayName}));
}

function signIn(email, password){
  return auth.signInWithEmailAndPassword(email, password);
}

function signOut(){
  return auth.signOut();
}
