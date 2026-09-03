

const DEFAULT={

name:"Your Name",

title:"Digital Creator",

email:"your@gmail.com",

phone:"+880 1XXXXXXXXX",

location:"Bangladesh",

availability:"Available for opportunities",

description:
"Welcome to my personal portfolio. I create modern digital experiences and build useful projects.",

about:
"I am a passionate creator who enjoys learning, building projects and working with modern technology.",

profileImage:"",

resume:"#",

links:{
github:"",
linkedin:"",
youtube:"",
facebook:"",
instagram:"",
website:""
},

services:[
{
icon:"💻",
title:"Web Development",
description:"Modern and responsive websites."
},
{
icon:"🎨",
title:"UI / UX Design",
description:"Clean and practical interfaces."
},
{
icon:"⚙️",
title:"Problem Solving",
description:"Technology-focused solutions."
}
],

projects:[
{
title:"Project One",
description:"My first project.",
link:"#",
image:""
},
{
title:"Project Two",
description:"My second project.",
link:"#",
image:""
}
],

skills:[
"HTML",
"CSS",
"JavaScript",
"Responsive Design",
"UI/UX",
"Git"
]

};


let data=clone(DEFAULT);


function clone(obj){
return JSON.parse(JSON.stringify(obj));
}


async function loadServerData(){

  try{

    const response = await fetch("/api/portfolio");

    if(!response.ok){
      throw new Error("Server data unavailable");
    }

    const saved = await response.json();

    if(
      saved &&
      typeof saved === "object" &&
      Object.keys(saved).length > 0
    ){

      data = mergeData(saved);

      return true;
    }

  }catch(error){

    console.log(
      "Server data unavailable, using local data."
    );

  }

  return false;
}

function mergeData(saved){

let result=clone(DEFAULT);

Object.keys(saved||{}).forEach(key=>{

if(
saved[key] &&
typeof saved[key]==="object" &&
!Array.isArray(saved[key]) &&
typeof result[key]==="object"
){

result[key]=Object.assign(result[key],saved[key]);

}else{

result[key]=saved[key];

}

});

return result;

}


async function saveData(){

  const response = await fetch("/api/portfolio", {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error("Portfolio save failed");
  }

  return response.json();
}


function toast(message){

let t=document.getElementById("toast");

t.textContent=message;

t.classList.add("show");

setTimeout(()=>{
t.classList.remove("show");
},1800);

}


function safeURL(url){

if(!url) return "#";

url = String(url).trim();

if(url === "#"){
  return "#";
}

if(
  url.startsWith("https://") ||
  url.startsWith("http://") ||
  url.startsWith("mailto:") ||
  url.startsWith("tel:")
){
  return url;
}

/* Allow common social links entered without protocol */
if(
  url.startsWith("www.") ||
  url.startsWith("github.com/") ||
  url.startsWith("linkedin.com/") ||
  url.startsWith("youtube.com/") ||
  url.startsWith("facebook.com/") ||
  url.startsWith("instagram.com/")
){
  return "https://" + url;
}

return "#";

}


/* SERVER IMAGE STORAGE */

async function saveImage(key, file){

  const formData = new FormData();

  formData.append("image", file);

  const response = await fetch("/api/images", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error("Image upload failed");
  }

  const result = await response.json();

  return result.filename;
}


async function getImage(key){

  if (!key) return null;

  return key;
}


async function deleteImage(key){

  /*
    Images are kept on the server.
    Portfolio data no longer depends on IndexedDB.
  */

  return true;
}


function id(){

  return Date.now() + "_" +
    Math.random()
      .toString(36)
      .substring(2,8);

}


async function imageURL(key){

  if(!key){
    return "";
  }

  // Server-uploaded image
  if(
    typeof key === "string" &&
    !key.startsWith("data:") &&
    !key.startsWith("blob:") &&
    !key.startsWith("http://") &&
    !key.startsWith("https://") &&
    !key.startsWith("/")
  ){

    return "/uploads/" + encodeURIComponent(key);

  }

  // Already a complete URL/path
  return key;

}

/* RENDER */

async function render(){

document.title=data.name+" — Portfolio";

document.getElementById("logo").textContent=
data.name+" PORTFOLIO";

document.getElementById("heroName").textContent=
data.name;

document.getElementById("heroTitle").textContent=
data.title;

document.getElementById("heroDescription").textContent=
data.description;

document.getElementById("availability").textContent=
data.availability;

document.getElementById("aboutText").textContent=
data.about;

document.getElementById("resume").href=
safeURL(data.resume);

document.getElementById("footerName").textContent=
data.name;

document.getElementById("year").textContent=
new Date().getFullYear();


/* PROFILE */

let profile=document.getElementById("profile");

let profileURL=await imageURL(data.profileImage);

profile.src=profileURL ||
"data:image/svg+xml;charset=UTF-8,"+
encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg"
viewBox="0 0 500 500">

<rect width="500" height="500"
fill="#0a1426"/>

<text x="50%" y="50%"
text-anchor="middle"
dominant-baseline="middle"
fill="#00c8ff"
font-size="40"
font-family="Arial">
YOUR PHOTO
</text>

</svg>`);


/* SERVICES */

let services="";

data.services.forEach(s=>{

services+=`

<div class="item">

<div class="icon">
${escapeHTML(s.icon)}
</div>

<h3>${escapeHTML(s.title)}</h3>

<p>
${escapeHTML(s.description)}
</p>

</div>

`;

});

document.getElementById("servicesGrid")
.innerHTML=services;


/* PROJECTS */

let projects="";

for(let i=0;i<data.projects.length;i++){

let p=data.projects[i];

let image=await imageURL(p.image);

projects+=`

<div class="item">

<img
class="project-image"
src="${image || 'data:image/svg+xml;charset=UTF-8,'+
encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg"
viewBox="0 0 800 500">

<rect width="800" height="500"
fill="#0a1426"/>

<text x="50%" y="50%"
text-anchor="middle"
dominant-baseline="middle"
fill="#00c8ff"
font-size="35"
font-family="Arial">
PROJECT IMAGE
</text>

</svg>`)}">

<h3>
${escapeHTML(p.title)}
</h3>

<p>
${escapeHTML(p.description)}
</p>

<a
class="btn primary"
href="${safeURL(p.link)}"
target="_blank">
View Project ↗
</a>

</div>

`;

}

document.getElementById("projectsGrid")
.innerHTML=projects;


/* SKILLS */

document.getElementById("skillsGrid")
.innerHTML=data.skills.map(skill=>`

<span class="skill">
${escapeHTML(skill)}
</span>

`).join("");


/* CONTACT */

document.getElementById("contactGrid")
.innerHTML=`

<a class="contact-box"
href="mailto:${encodeURIComponent(data.email)}">

<small>Email</small>

<strong>
${escapeHTML(data.email)}
</strong>

</a>


<a class="contact-box"
href="tel:${escapeHTML(
data.phone.replace(/\s/g,"")
)}">

<small>Phone</small>

<strong>
${escapeHTML(data.phone)}
</strong>

</a>


<div class="contact-box">

<small>Location</small>

<strong>
${escapeHTML(data.location)}
</strong>

</div>

`;


/* SOCIALS */

document.getElementById("socials")
.innerHTML=

Object.entries(data.links)

.filter(([name,url])=>url)

.map(([name,url])=>`

<a
class="social"
href="${safeURL(url)}"
target="_blank"
rel="noopener">

${escapeHTML(
name.charAt(0).toUpperCase()+name.slice(1)
)} ↗

</a>

`).join("");

}


function escapeHTML(value){

return String(value ?? "")
.replace(/[&<>"']/g,function(char){

return {

"&":"&amp;",
"<":"&lt;",
">":"&gt;",
'"':"&quot;",
"'":"&#039;"

}[char];

});

}


/* EDITOR */

function openEditor(){

fillEditor();

document.getElementById("overlay")
.classList.add("open");

document.body.style.overflow="hidden";

}


function closeEditor(){

document.getElementById("overlay")
.classList.remove("open");

document.body.style.overflow="";

}


function field(id){

return document.getElementById(id);

}


async function fillEditor(){

field("eName").value=data.name;

field("eTitle").value=data.title;

field("eEmail").value=data.email;

field("ePhone").value=data.phone;

field("eLocation").value=data.location;

field("eAvailability").value=data.availability;

field("eDescription").value=data.description;

field("eAbout").value=data.about;

field("eResume").value=data.resume;

field("eSkills").value=data.skills.join("\n");


/* LINKS */

let links="";

Object.entries(data.links).forEach(([name,url])=>{

links+=`

<div class="field">

<label>${escapeHTML(name)}</label>

<input
type="url"
data-link="${escapeHTML(name)}"
value="${escapeHTML(url)}"
placeholder="https://...">

</div>

`;

});

field("linksForm").innerHTML=links;


renderServicesForm();

await renderProjectsForm();

refreshProfileThumb();

}


async function refreshProfileThumb(){

let url=await imageURL(data.profileImage);

field("profileThumb").src=url||"";

}


/* SERVICES EDITOR */

function renderServicesForm(){

let html="";

data.services.forEach((s,i)=>{

html+=`

<div class="repeat">

<div class="repeat-head">

<b>Service ${i+1}</b>

<button
class="small-button"
onclick="removeService(${i})">

🗑️ Remove

</button>

</div>


<div class="form">

<div class="field">

<label>Icon</label>

<input
data-service="${i}"
data-field="icon"
value="${escapeHTML(s.icon)}">

</div>


<div class="field">

<label>Title</label>

<input
data-service="${i}"
data-field="title"
value="${escapeHTML(s.title)}">

</div>


<div class="field full">

<label>Description</label>

<textarea
data-service="${i}"
data-field="description">
${escapeHTML(s.description)}
</textarea>

</div>

</div>

</div>

`;

});

field("servicesForm").innerHTML=html;

}


/* PROJECT EDITOR */

async function renderProjectsForm(){

let html="";

for(let i=0;i<data.projects.length;i++){

let p=data.projects[i];

let image=await imageURL(p.image);

html+=`

<div class="repeat">

<div class="repeat-head">

<b>Project ${i+1}</b>

<button
class="small-button"
onclick="removeProject(${i})">

🗑️ Remove

</button>

</div>


<div class="form">


<div class="field">

<label>Project Name</label>

<input
data-project="${i}"
data-field="title"
value="${escapeHTML(p.title)}">

</div>


<div class="field">

<label>Project Link</label>

<input
data-project="${i}"
data-field="link"
value="${escapeHTML(p.link)}"
placeholder="https://...">

</div>


<div class="field full">

<label>Description</label>

<textarea
data-project="${i}"
data-field="description">
${escapeHTML(p.description)}
</textarea>

</div>


<div class="field full">

<label>Project Image</label>

<div class="upload">

<img
class="thumb"
id="projectThumb${i}"
src="${image}">

<input
class="file"
id="projectFile${i}"
type="file"
accept="image/*"
onchange="projectImage(${i},this.files[0])">

<label
class="file-button"
for="projectFile${i}">

🖼️ Choose Image

</label>

<button
class="small-button"
onclick="removeProjectImage(${i})">

Remove Image

</button>

</div>

</div>

</div>

</div>

`;

}

field("projectsForm").innerHTML=html;

}


/* PROFILE UPLOAD */

field("profileFile")?.addEventListener(
"change",
async function(){

  try {

    let file = this.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast("Please select an image");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast("Image must be under 10MB");
      return;
    }

    const filename = await saveImage(
      "profile",
      file
    );

    data.profileImage = filename;

    await refreshProfileThumb();

    toast("Profile image uploaded ✓");

  } catch (error) {

    console.error(error);

    toast("Image upload failed");

  }

});


const removeProfileButton = field("removeProfile");
if(removeProfileButton){
removeProfileButton.onclick=async function(){

await deleteImage(data.profileImage);

data.profileImage="";

await refreshProfileThumb();

toast("Profile image removed");

};
}


/* PROJECT UPLOAD */

async function projectImage(index,file){

if(!file)return;

if(data.projects[index].image){

await deleteImage(
data.projects[index].image
);

}

let key = "project_" + id();

let filename = await saveImage(key, file);

data.projects[index].image = filename;

await saveData();

await renderProjectsForm();

toast("Project image selected ✓");

}


async function removeProjectImage(index){

await deleteImage(
data.projects[index].image
);

data.projects[index].image="";

await renderProjectsForm();

}


/* ADD SERVICE */

const addServiceButton = field("addService");
if(addServiceButton){
addServiceButton.onclick=function(){

data.services.push({

icon:"✨",

title:"New Service",

description:"Describe your service."

});

renderServicesForm();

};
}


/* REMOVE SERVICE */

function removeService(index){

data.services.splice(index,1);

renderServicesForm();

}


/* ADD PROJECT */

const addProjectButton = field("addProject");
if(addProjectButton){
addProjectButton.onclick=function(){

data.projects.push({

title:"New Project",

description:"Describe your project.",

link:"#",

image:""

});

renderProjectsForm();

};
}


/* REMOVE PROJECT */

async function removeProject(index){

await deleteImage(
data.projects[index].image
);

data.projects.splice(index,1);

await renderProjectsForm();

}


/* SAVE */

const saveButton = field("save");

if(saveButton){
saveButton.onclick=async function(){

data.name=
field("eName").value.trim() ||
"Your Name";

data.title=
field("eTitle").value.trim();

data.email=
field("eEmail").value.trim();

data.phone=
field("ePhone").value.trim();

data.location=
field("eLocation").value.trim();

data.availability=
field("eAvailability").value.trim();

data.description=
field("eDescription").value.trim();

data.about=
field("eAbout").value.trim();

data.resume=
field("eResume").value.trim() ||
"#";


/* SOCIAL LINKS */

document
.querySelectorAll("[data-link]")
.forEach(input=>{

let key=input.dataset.link;

data.links[key]=input.value.trim();

});


/* SERVICES */

document
.querySelectorAll("[data-service]")
.forEach(input=>{

let index=Number(input.dataset.service);

let key=input.dataset.field;

data.services[index][key]=
input.value;

});


/* PROJECTS */

document
.querySelectorAll("[data-project]")
.forEach(input=>{

let index=Number(input.dataset.project);

let key=input.dataset.field;

data.projects[index][key]=
input.value;

});


/* SKILLS */

data.skills=
field("eSkills")
.value
.split("\n")
.map(x=>x.trim())
.filter(Boolean);


console.log("LINKS BEFORE SAVE:", data.links);

await saveData();

await render();

closeEditor();

toast("Portfolio saved ✓");

};

}


/* RESET */

const resetButton = field("reset");

if(resetButton){
resetButton.onclick=async function(){

let ok=confirm(
"Reset the portfolio?"
);

if(!ok)return;

if(data.profileImage)
await deleteImage(data.profileImage);

for(let p of data.projects){

if(p.image)
await deleteImage(p.image);

}

data=clone(DEFAULT);

saveData();

await fillEditor();

await render();

toast("Portfolio reset");

};
}


/* CLOSE */

const closeButton = field("close");

if(closeButton){
  closeButton.onclick = closeEditor;
}

const editorOverlay = field("overlay");

if(editorOverlay){
  editorOverlay.addEventListener(
"click",
function(e){

if(e.target===editorOverlay)
closeEditor();

});

}


/* MOBILE MENU */

const hamburgerButton = field("hamb");
if(hamburgerButton){
hamburgerButton.onclick=function(){

field("menu")
.classList.toggle("open");

};
}


document.addEventListener(
"click",
function(e){

if(e.target.matches(".menu a")){

field("menu")
.classList.remove("open");

}

});


/* OPEN EDITOR */

const openEditorButton = field("openEditor");

if(openEditorButton){
  openEditorButton.onclick = openEditor;
}


/* START */

(async function(){

  console.log("STARTING PORTFOLIO");

  const loaded = await loadServerData();

  console.log("SERVER LOADED:", loaded);
  console.log("CURRENT DATA:", data);

  await render();

  console.log("RENDER COMPLETE");

})();

