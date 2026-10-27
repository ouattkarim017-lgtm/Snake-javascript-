

const boutonPause = document.getElementById("pause")
const NiveauDuJeu = document.getElementById('niveau');
const zone = document.querySelector(".EspaceDeJeu");
const pomme = document.getElementById('pomme');
const boutonJouer = document.getElementById("jouer");
const valeurscore = document.getElementById('valeurscore');
const meilleurscore = document.getElementById('meilleurscore');
const message = document.getElementById('message');
const valeurScore = document.getElementById("valeurscore");
const taille = 20;                             //la taille des case de l'espace de jeu
const longueurZone = zone.clientHeight;
const largeurZone = zone.clientWidth;


let corps = [{ x: 0, y: 0 }]; // le serpent; corps[0]: est la tete  
let score = 0;
let meilleur = 0;
let pommeX = 0;
let pommeY = 0;
let direction = "droite"; //le direction actuelle
let prochaindirection = "droite";
let minuteur = null //arreter la boucle
let enCours = false  //la partie est-elle en cours
let isPause = false;



// --- meilleur score sauvegardé dans le navigateur ---
try {
    meilleur = Number(localStorage.getItem("meilleurserpent")) || 0
} catch (e) {
    meilleur = 0;
}

meilleurscore.textContent = meilleur;


//table opposition
const oppose = {
    haut: "bas",
    bas: "haut",
    droite: "gauche",
    gauche: "droite"
}

//changé la direction du serpent
function changerDirection(nouvelle) {
    if(isPause) return;
    if (nouvelle !== oppose[direction])
        prochaindirection = nouvelle
}

// vrai si la case (cx, cy) est occuper par le serpent
function surLeSerpent(cx, cy) {
    return corps.some(segment => segment.x === cx && segment.y === cy)
}



// place la pomme sur une case aléatoire de la grille
function PlacePomme() {
    const colonnes = largeurZone / taille;
    const lignes = longueurZone / taille;

    do {
        pommeX = Math.floor(Math.random() * colonnes) * taille
        pommeY = Math.floor(Math.random() * lignes) * taille
    } while (surLeSerpent(pommeX, pommeY))


    pomme.style.left = pommeX + "px"
    pomme.style.top = pommeY + "px"
}


// efface puis redessine tous les segments
function desiner() {
    zone.querySelectorAll(".segment").forEach(s => s.remove())

    corps.forEach((segment, i) => {
        const div = document.createElement("div")
        div.classList.add("segment")
        if (i === 0) div.classList.add("tete");
        div.style.left = segment.x + "px";
        div.style.top = segment.y + "px";
        zone.appendChild(div);
    })

}

// --- vitesse : plus le score monte, plus le délai est court ---
function calculDelai() {
    const PommeMange = score / 5;

    const Jeu = NiveauDuJeu.value;
    if (Jeu === "facile") {
        return Math.max(70, 500 - PommeMange * 8) //jamais en dessous de 70ms
    };

    if (Jeu === "moyen") {
        return Math.max(70, 200 - PommeMange * 8) //jamais en dessous de 70ms
    };

    if (Jeu === "difficile") {
        return Math.max(70, 100 - PommeMange * 8) //jamais en dessous de 70ms
    };
}


// remet le serpent au point de depart
function reinitialiser() {
    corps = [{ x: 0, y: 0 }];
    score = 0;
    direction = "droite";
    prochaindirection = "droite";
    valeurScore.textContent = score;
    message.style.display = "none";

    PlacePomme();
    desiner();
}


//Arrete la boucle et annonce la fin
function FinDePartie(texte) {
    enCours = false;
    clearTimeout(minuteur);
    boutonJouer.disabled = false;
    isPause = false;
    boutonPause.disabled = true
    boutonPause.textContent = "Pause"

    let nouveauRecord = false
    if (score > meilleur) {
        meilleur = score;
        nouveauRecord = true
    }

    meilleurscore.textContent = meilleur;
    try {
        localStorage.setItem("meileurserpent", meilleur)
    } catch (e) { }

    message.innerHTML = `<p class="messageEchec">${texte}<p>` + "<br>Score : " + score +
        (nouveauRecord ? "<br>nouveau Record ! : " : "") +
        "<button class='rejouer'>Recommencer</button>"
    message.style.display = "flex";


    //bouton pour recommencer le jeu
    let rejouer = document.querySelector(".rejouer");
    rejouer.addEventListener("click", () => {
        reinitialiser()
    })
}

// la boucle : se rappelle elle-même avec un délai qui change
function boucle() {
    deplace()
    if (enCours) {
        minuteur = setTimeout(boucle, calculDelai())
        NiveauDuJeu.disabled = true; //gerer les select lorsque le jeu est en cours
    } else {
        NiveauDuJeu.disabled = false; //gerer les select lorsque le jeu n'est pas en cours
    }
}

//mettre en pause
function MetEnPause() {
    if (!enCours) return;

    if (!isPause) {
        isPause = true;
        clearTimeout(minuteur)
        boutonPause.textContent = "Reprendre"
    } else {
        isPause = false;
        minuteur = setTimeout(boucle, calculDelai());
        boutonPause.textContent = "Pause";
    }
boutonPause.blur()
}

boutonPause.addEventListener("click", MetEnPause);

//vérifie si la position est en dehors de la zone
function toucherLeMur(cx, cy) {
    return (cx < 0 || cy < 0 || cx + taille > largeurZone || cy + taille > longueurZone);
}

//la fonction pour faire deplacer le serpent
function deplace() {

    direction = prochaindirection;

    //calcule la nouvelle tete
    let nx = corps[0].x
    let ny = corps[0].y

    if (direction === "droite") nx += taille
    if (direction === "gauche") nx -= taille
    if (direction === "bas") ny += taille
    if (direction === "haut") ny -= taille

    //le mur
    if (toucherLeMur(nx, ny)) {
        FinDePartie("Perdu, le serpent a touché le mur")
        return;
    }

    //a-t'il mangé la pomme
    const mange = (nx === pommeX && ny === pommeY)

    //sinon la queue avance: on la retire avant de tester le corps
    if (!mange) corps.pop()

    //  collision avec soi-même
    if (surLeSerpent(nx, ny)) {
        FinDePartie("Perdu ! , le serpent s'est mordu")
        return
    }

    //ajouetr une nouvelle tete
    corps.unshift({ x: nx, y: ny })

    if (nx === pommeX && ny === pommeY) {
        score += 5
        valeurScore.textContent = score;
        PlacePomme()
    }

    desiner()
}


//bouton de l'ecran pour les dirction
document.getElementById("droite")
    .addEventListener("click", () => changerDirection("droite"))

document.getElementById("gauche")
    .addEventListener("click", () => changerDirection("gauche"))

document.getElementById("bas")
    .addEventListener("click", () => changerDirection("bas"))

document.getElementById("haut")
    .addEventListener("click", () => changerDirection("haut"))


//ecouter les clique du clavier
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") changerDirection("haut");
    if (e.key === "ArrowDown") changerDirection("bas");
    if (e.key === "ArrowRight") changerDirection("droite");
    if (e.key === "ArrowLeft") changerDirection("gauche")

        if(e.key === "") boutonPause();

    //empecher la fleche de diriger la page
    if (e.key.startsWith("Arrow")) e.preventDefault()
})



//ecouter l'evenement du bouton jouer
boutonJouer.addEventListener("click", () => {
    clearInterval(minuteur)
    enCours = true;
    isPause = false;
    boutonPause.disabled = false;
    boutonPause.textContent = "Pause";
    boutonJouer.disabled = true;
    boutonJouer.blur();
    minuteur = setTimeout(boucle, calculDelai())
});


// document.getElementById("pause")
//     .addEventListener("click", function () {
//     })

desiner()
// affiche une pomme dès le chargement de la page
PlacePomme()






































// fonction pour deplacé le serpent

// let positionX = 0;
// let MonObjet = document.getElementById("serpent");

// function Deplacement() {
//     positionX += 2;
//     MonObjet.style.transform = `translateX(${positionX}px)`;
//     if (positionX < 345) {
//         requestAnimationFrame(Deplacement)
//     }
// }

// //fonction pour changer la direction du serpent
// const EnHaut = document.getElementById("en-haut");
// const EnBas = document.getElementById("en-bas");
// const Agauche = document.getElementById("a-gauche");
// const Adroit = document.getElementById("a-droit");

// function direction() {

// }


// document.getElementById("Jouer")
//     .addEventListener('click', function() {
//         Deplacement()
//     })




