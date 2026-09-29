const startButton = document.getElementById("start-button");
const startScreen = document.getElementById("start-screen");
const studyTarget = document.getElementById("study-target");

const VIDEO_FOLDER = "../Tablet_Study1_Videos/";

const WARMUP_HOTSPOTS = {
  1: [
    { id: "other", x: 0, y: 0, width: 1280, height: 720 },
    { id: "triangle", x: 148, y: 185, width: 367, height: 350 },
    { id: "red_square", x: 798, y: 195, width: 327, height: 330 },
  ],
  2: [
    { id: "other", x: 0, y: 0, width: 1280, height: 720 },
    { id: "triangle", x: 826, y: 185, width: 368, height: 350 },
    { id: "red_square", x: 164, y: 185, width: 349, height: 350 },
  ],
};

const AGE_HOTSPOTS = [
  ...[3, 4, 5, 6, 7].map((age, index) => ({
    id: String(age), x: 40 + index * 255, y: 145, width: 180, height: 180,
  })),
  ...[8, 9, 10, 11, 12].map((age, index) => ({
    id: String(age), x: 40 + index * 255, y: 395, width: 180, height: 180,
  })),
];

const THREE_CHOICE_AREAS = [
  { x: 10, y: 250, width: 380, height: 215 },
  { x: 450, y: 250, width: 380, height: 215 },
  { x: 895, y: 250, width: 380, height: 215 },
];

function twoChoiceHotspots(leftChoice, rightChoice) {
  return [
    { id: leftChoice, x: 100, y: 170, width: 430, height: 450 },
    { id: rightChoice, x: 750, y: 170, width: 430, height: 450 },
  ];
}

function sizeHotspotVideo() {
  const container = document.getElementById("jspsych-video-hotspots-container");
  const video = document.getElementById("jspsych-video-hotspots-stimulus");
  container.style.zoom = String(Math.min(studyTarget.clientWidth / 1280, studyTarget.clientHeight / 720));
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
}

function videoTrial(filename, trialId) {
  return {
    type: jsPsychVideoButtonResponse,
    stimulus: [`${VIDEO_FOLDER}${filename}`],
    width: 1280,
    height: 720,
    choices: [],
    trial_ends_after_video: true,
    on_load: () => {
      const video = document.getElementById("jspsych-video-button-response-stimulus");
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
    },
    data: { trial_id: trialId },
  };
}

function twoChoiceQuestion(filename, trialId, leftChoice, rightChoice) {
  return {
    type: jsPsychVideoHotspots,
    stimulus: `${VIDEO_FOLDER}${filename}`,
    hotspots: twoChoiceHotspots(leftChoice, rightChoice),
    hotspot_highlight_css: "background-color: transparent; border: 0;",
    video_preload: false,
    data: { trial_id: trialId, left_choice: leftChoice, right_choice: rightChoice },
    on_load: sizeHotspotVideo,
  };
}

function yesNoQuestion(filename, trialId, version) {
  // Temporary visible answers: the videos do not show Yes/No tap targets.
  const choices = version === 1 ? ["Yes", "No"] : ["No", "Yes"];
  return {
    type: jsPsychVideoButtonResponse,
    stimulus: [`${VIDEO_FOLDER}${filename}`],
    width: 1280,
    height: 720,
    choices,
    response_allowed_while_playing: false,
    trial_ends_after_video: false,
    data: { trial_id: trialId },
    on_load: () => {
      studyTarget.classList.add("yes-no-trial");
      const video = document.getElementById("jspsych-video-button-response-stimulus");
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
    },
    on_finish: (data) => {
      data.answer = choices[data.response].toLowerCase();
      studyTarget.classList.remove("yes-no-trial");
    },
  };
}

startButton.addEventListener("click", () => {
  startButton.disabled = true;
  startScreen.hidden = true;
  studyTarget.hidden = false;

  const jsPsych = initJsPsych({
    display_element: "study-target",
    on_finish: () => {
      studyTarget.innerHTML = `
        <div class="complete">
          <h2>Study complete</h2>
          <p>Please let a researcher know that you are done.</p>
          <button type="button" onclick="location.reload()">Start again</button>
        </div>`;
    },
  });

  const warmupVersion = Math.random() < 0.5 ? 1 : 2;

  function warmupQuestion(filename, trialId) {
    return {
      type: jsPsychVideoHotspots,
      stimulus: `${VIDEO_FOLDER}${filename}`,
      hotspots: WARMUP_HOTSPOTS[warmupVersion],
      hotspot_highlight_css: "background-color: transparent; border: 0;",
      video_preload: false,
      data: { trial_id: trialId, warmup_version: warmupVersion },
      on_load: sizeHotspotVideo,
      on_finish: (data) => {
        data.correct = data.hotspot_clicked === "red_square";
      },
    };
  }

  const firstWarmup = warmupQuestion(`warmup_v${warmupVersion}.mp4`, "warmup_initial");
  const retryWarmup = warmupQuestion(`warmup_redo_v${warmupVersion}.mp4`, "warmup_retry");

  const retryIfNeeded = {
    timeline: [retryWarmup],
    conditional_function: () => {
      const firstAnswer = jsPsych.data.get().filter({ trial_id: "warmup_initial" }).last(1).values()[0];
      return firstAnswer?.correct === false;
    },
  };

  const ageQuestion = {
    type: jsPsychVideoHotspots,
    stimulus: `${VIDEO_FOLDER}age.m4v`,
    hotspots: AGE_HOTSPOTS,
    hotspot_highlight_css: "background-color: transparent; border: 0;",
    video_preload: false,
    data: { trial_id: "age" },
    on_load: sizeHotspotVideo,
    on_finish: (data) => {
      data.age_years = Number(data.hotspot_clicked);
    },
  };

  const sarcaCondition = Math.random() < 0.5 ? "A" : "B";
  const sarcaVersion = Math.random() < 0.5 ? 1 : 2;
  const glorpVersion = Math.random() < 0.5 ? 1 : 2;
  const closenessVersion = Math.random() < 0.5 ? 1 : 2;
  const trial3Version = Math.random() < 0.5 ? 1 : 2;
  const ecoSarcaVersion = Math.random() < 0.5 ? 1 : 2;
  const ecoGlorpVersion = Math.random() < 0.5 ? 1 : 2;
  const kindSarcaVersion = Math.random() < 0.5 ? 1 : 2;
  const kindGlorpVersion = Math.random() < 0.5 ? 1 : 2;
  jsPsych.data.addProperties({
    sarca_condition: sarcaCondition,
    sarca_video_version: sarcaVersion,
    glorp_video_version: glorpVersion,
    closeness_video_version: closenessVersion,
    trial3_video_version: trial3Version,
    eco_sarca_video_version: ecoSarcaVersion,
    eco_glorp_video_version: ecoGlorpVersion,
    kind_sarca_video_version: kindSarcaVersion,
    kind_glorp_video_version: kindGlorpVersion,
  });

  const sarcaChoices = sarcaCondition === "A" ? ["ant", "grass"] : ["bee", "grass"];
  const sarcaLeft = sarcaVersion === 1 ? sarcaChoices[0] : sarcaChoices[1];
  const sarcaRight = sarcaVersion === 1 ? sarcaChoices[1] : sarcaChoices[0];
  const glorpLeft = glorpVersion === 1 ? "oak_tree" : "kangaroo";
  const glorpRight = glorpVersion === 1 ? "kangaroo" : "oak_tree";
  const closenessChoices = closenessVersion === 1
    ? ["really_far", "sort_of_close", "really_close"]
    : ["really_close", "sort_of_close", "really_far"];
  const closenessQuestion = {
    type: jsPsychVideoHotspots,
    stimulus: `${VIDEO_FOLDER}closenesstonature_affect_v${closenessVersion}.m4v`,
    hotspots: THREE_CHOICE_AREAS.map((area, index) => ({ id: closenessChoices[index], ...area })),
    hotspot_highlight_css: "background-color: transparent; border: 0;",
    video_preload: false,
    data: { trial_id: "closeness_to_nature" },
    on_load: sizeHotspotVideo,
  };
  const scaleChoices = trial3Version === 1
    ? ["not_at_all", "sometimes", "a_lot"]
    : ["a_lot", "sometimes", "not_at_all"];
  function scaleQuestion(filename, trialId) {
    return {
      type: jsPsychVideoHotspots,
      stimulus: `${VIDEO_FOLDER}${filename}`,
      hotspots: THREE_CHOICE_AREAS.map((area, index) => ({ id: scaleChoices[index], ...area })),
      hotspot_highlight_css: "background-color: transparent; border: 0;",
      video_preload: false,
      data: { trial_id: trialId },
      on_load: sizeHotspotVideo,
    };
  }

  jsPsych.run([
    // Trial 1
    videoTrial("hello2.mp4", "hello_intro"),
    firstWarmup,
    retryIfNeeded,
    videoTrial("warmup_end.mp4", "warmup_end"),
    videoTrial("play_for_real.mp4", "play_for_real"),
    ageQuestion,
    twoChoiceQuestion(`ind_sarca_${sarcaCondition}_v${sarcaVersion}.m4v`, "sarca", sarcaLeft, sarcaRight),
    twoChoiceQuestion(`glorp_v${glorpVersion}.mp4`, "glorp", glorpLeft, glorpRight),
    // Trial 2
    closenessQuestion,
    // Trial 3
    videoTrial(`practice_warmup_v${trial3Version}.mp4`, "practice_warmup_intro"),
    scaleQuestion(`practice_birds_fly_v${trial3Version}.m4v`, "practice_birds_fly"),
    videoTrial(`practice_birds_fly_feedback_v${trial3Version}.mp4`, "practice_birds_fly_feedback"),
    scaleQuestion(`practice_animals_lay_eggs_v${trial3Version}.m4v`, "practice_animals_lay_eggs"),
    videoTrial(`practice_animals_lay_eggs_feedback_v${trial3Version}.mp4`, "practice_animals_lay_eggs_feedback"),
    scaleQuestion(`practice_bird_car_v${trial3Version}.m4v`, "practice_bird_car"),
    videoTrial(`practice_bird_car_feedback_v${trial3Version}.mp4`, "practice_bird_car_feedback"),
    videoTrial("play_for_real.mp4", "attitude_intro"),
    scaleQuestion(`mor_tree_important_v${trial3Version}.m4v`, "tree_important"),
    scaleQuestion(`mor_bug_important_v${trial3Version}.m4v`, "bug_important"),
    scaleQuestion(`mor_tree_protect_v${trial3Version}.m4v`, "tree_protect"),
    scaleQuestion(`mor_bug_protect_v${trial3Version}.m4v`, "bug_protect"),
    scaleQuestion(`exp_time_v${trial3Version}.m4v`, "time"),
    scaleQuestion(`exp_books_shows_v${trial3Version}.m4v`, "books"),
    // Trial 4
    videoTrial("mem_intro.mp4", "mem_intro"),
    yesNoQuestion(`eco_sarca_${sarcaCondition}_v${ecoSarcaVersion}.mp4`, "eco_sarca", ecoSarcaVersion),
    yesNoQuestion(`eco_glorp_v${ecoGlorpVersion}.mp4`, "eco_glorp", ecoGlorpVersion),
    yesNoQuestion(`kind_sarca_v${kindSarcaVersion}.mp4`, "kind_sarca", kindSarcaVersion),
    yesNoQuestion(`kind_glorp_v${kindGlorpVersion}.mp4`, "kind_glorp", kindGlorpVersion),
    // Ending
    videoTrial("thanksforplaying_audio.mp4", "study_end"),
  ]);
});
