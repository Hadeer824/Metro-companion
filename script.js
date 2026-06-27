(() => {
    const STORAGE_KEYS = {
        login: "metro-companion-login",
        profile: "metro-companion-profile",
        destination: "metro-companion-destination",
        history: "metro-companion-history",
        sound: "metro-companion-sound",
    };

    const metroData = {
        line1: {
            id: "line1",
            name: "الخط الأول",
            color: "#d6415b",
            stations: [
                "حلوان",
                "جامعة حلوان",
                "المعادي",
                "دار السلام",
                "الملك الصالح",
                "السيدة زينب",
                "سعد زغلول",
                "السادات",
                "جمال عبد الناصر",
                "الشهداء",
                "غمرة",
                "الدمرداش",
                "كوبري القبة",
                "حمامات القبة",
                "سراي القبة",
                "حدائق الزيتون",
                "حلمية الزيتون",
                "المطرية",
                "عين شمس",
                "المرج",
            ],
        },
        line2: {
            id: "line2",
            name: "الخط الثاني",
            color: "#1a9f73",
            stations: [
                "شبرا الخيمة",
                "كلية الزراعة",
                "المظلات",
                "الخلفاوي",
                "سانت تريزا",
                "روض الفرج",
                "مسرة",
                "الشهداء",
                "العتبة",
                "محمد نجيب",
                "السادات",
                "الأوبرا",
                "الدقي",
                "البحوث",
                "جامعة القاهرة",
                "فيصل",
                "الجيزة",
                "أم المصريين",
                "المنيب",
            ],
        },
        line3: {
            id: "line3",
            name: "الخط الثالث",
            color: "#f0ab21",
            stations: [
                "عدلي منصور",
                "هليوبوليس",
                "الأهرام",
                "كلية البنات",
                "الاستاد",
                "أرض المعارض",
                "العباسية",
                "عبده باشا",
                "الجيش",
                "باب الشعرية",
                "العتبة",
                "جمال عبد الناصر",
                "ماسبيرو",
                "صفاء حجازي",
                "الكيت كات",
                "السودان",
                "إمبابة",
            ],
        },
    };

    const emergencyPoints = [
        {
            name: "نقطة شرطة المترو - السادات",
            station: "السادات",
            eta: "3 دقائق",
            details: "قريبة من بوابة الخروج الرئيسية وبها نقطة إرشاد.",
        },
        {
            name: "وحدة مساعدة الركاب - العتبة",
            station: "العتبة",
            eta: "5 دقائق",
            details: "نقطة دعم وتجربة بلاغ سريع بالقرب من الرصيف.",
        },
        {
            name: "مكتب أمان المحطة - الشهداء",
            station: "الشهداء",
            eta: "4 دقائق",
            details: "متاح للتوجيه الفوري والإبلاغ عن المضايقات.",
        },
        {
            name: "نقطة إسعاف - الدقي",
            station: "الدقي",
            eta: "7 دقائق",
            details: "مناسبة للحالات الصحية الطارئة أو التوتر الشديد.",
        },
        {
            name: "مكتب الاستعلامات - عدلي منصور",
            station: "عدلي منصور",
            eta: "6 دقائق",
            details: "يمكن استخدامه كنقطة انتظار آمنة لحين وصول المساعدة.",
        },
        {
            name: "دورية أمن - المعادي",
            station: "المعادي",
            eta: "8 دقائق",
            details: "مناسبة إذا كنتِ تفضلي التحرك إلى مكان أكثر هدوءًا.",
        },
    ];

    const transferPenalty = {
        "السادات": 3,
        "الشهداء": 2,
        "العتبة": 3,
        "جمال عبد الناصر": 2,
    };

    const state = {
        currentPage: "home",
        user: null,
        destination: "",
        route: null,
        history: [],
        profile: {
            name: "",
            emergencyPhone: "",
            favoriteStation: "",
            vibration: true,
        },
        soundEnabled: true,
        lineStatus: {},
    };

    const elements = {};

    document.addEventListener("DOMContentLoaded", init);

    function init() {
        cacheElements();
        hydrateState();
        bindEvents();
        renderStationOptions();
        refreshLineStatus();
        renderSafePlaces();
        renderMap();
        updateHomeMetrics();
        syncProfileForm();
        startClock();
        ensureWelcomeMessage();
        applyLoginState();
        window.speechSynthesis?.getVoices();
        if ("speechSynthesis" in window) {
            window.speechSynthesis.onvoiceschanged = () => {
                updateVoiceStatus("تم العثور على أصوات متاحة في المتصفح.");
            };
        }
        setInterval(() => {
            refreshLineStatus();
            if (state.route) {
                renderRouteResult(state.route);
            }
        }, 25000);
    }

    function cacheElements() {
        elements.loginScreen = document.getElementById("loginScreen");
        elements.appShell = document.getElementById("appShell");
        elements.loginForm = document.getElementById("loginForm");
        elements.loginName = document.getElementById("loginName");
        elements.loginPassword = document.getElementById("loginPassword");
        elements.rememberMe = document.getElementById("rememberMe");
        elements.guestLoginBtn = document.getElementById("guestLoginBtn");
        elements.navItems = Array.from(document.querySelectorAll(".nav-item"));
        elements.pages = Array.from(document.querySelectorAll(".page"));
        elements.profileShortcut = document.getElementById("profileShortcut");
        elements.liveClock = document.getElementById("liveClock");
        elements.welcomeText = document.getElementById("welcomeText");
        elements.currentDestinationLabel = document.getElementById("currentDestinationLabel");
        elements.leastCrowdedNow = document.getElementById("leastCrowdedNow");
        elements.leastCrowdedTime = document.getElementById("leastCrowdedTime");
        elements.lastRouteSummary = document.getElementById("lastRouteSummary");
        elements.lastRouteMeta = document.getElementById("lastRouteMeta");
        elements.lineStatusBoard = document.getElementById("lineStatusBoard");
        elements.liveMapBoard = document.getElementById("liveMapBoard");
        elements.mapRefreshLabel = document.getElementById("mapRefreshLabel");
        elements.startStation = document.getElementById("startStation");
        elements.endStation = document.getElementById("endStation");
        elements.routeForm = document.getElementById("routeForm");
        elements.swapStationsBtn = document.getElementById("swapStationsBtn");
        elements.routeResult = document.getElementById("routeResult");
        elements.arrivalAlertBtn = document.getElementById("arrivalAlertBtn");
        elements.testVoiceBtn = document.getElementById("testVoiceBtn");
        elements.voiceFeedback = document.getElementById("voiceFeedback");
        elements.voiceDestinationStatus = document.getElementById("voiceDestinationStatus");
        elements.soundToggle = document.getElementById("soundToggle");
        elements.mapLayout = document.getElementById("mapLayout");
        elements.helpRequestBtn = document.getElementById("helpRequestBtn");
        elements.shareLocationBtn = document.getElementById("shareLocationBtn");
        elements.helpStatus = document.getElementById("helpStatus");
        elements.riskInput = document.getElementById("riskInput");
        elements.riskAnalyzeBtn = document.getElementById("riskAnalyzeBtn");
        elements.riskResult = document.getElementById("riskResult");
        elements.safePlacesList = document.getElementById("safePlacesList");
        elements.profileForm = document.getElementById("profileForm");
        elements.profileName = document.getElementById("profileName");
        elements.profileEmergencyPhone = document.getElementById("profileEmergencyPhone");
        elements.profileFavoriteStation = document.getElementById("profileFavoriteStation");
        elements.profileVibrationToggle = document.getElementById("profileVibrationToggle");
        elements.profileSummary = document.getElementById("profileSummary");
        elements.logoutBtn = document.getElementById("logoutBtn");
        elements.openChatFromHome = document.getElementById("openChatFromHome");
        elements.openChatFromProfile = document.getElementById("openChatFromProfile");
        elements.chatFab = document.getElementById("chatFab");
        elements.chatPanel = document.getElementById("chatPanel");
        elements.closeChatBtn = document.getElementById("closeChatBtn");
        elements.chatMessages = document.getElementById("chatMessages");
        elements.chatForm = document.getElementById("chatForm");
        elements.chatInput = document.getElementById("chatInput");
        elements.chatQuickActions = document.getElementById("chatQuickActions");
        elements.toastStack = document.getElementById("toastStack");
    }

    function hydrateState() {
        const savedLogin = readStorage(STORAGE_KEYS.login, null);
        const savedProfile = readStorage(STORAGE_KEYS.profile, null);
        const savedHistory = readStorage(STORAGE_KEYS.history, []);
        const savedDestination = localStorage.getItem(STORAGE_KEYS.destination);
        const savedSound = localStorage.getItem(STORAGE_KEYS.sound);

        if (savedLogin) {
            state.user = savedLogin;
        }

        if (savedProfile) {
            state.profile = { ...state.profile, ...savedProfile };
        }

        state.history = Array.isArray(savedHistory) ? savedHistory : [];
        state.destination = savedDestination || "";
        state.soundEnabled = savedSound === null ? true : savedSound === "true";
    }

    function bindEvents() {
        elements.loginForm.addEventListener("submit", handleLogin);
        elements.guestLoginBtn.addEventListener("click", () => loginUser("زائر", false));
        elements.profileShortcut.addEventListener("click", () => switchPage("profile"));
        elements.navItems.forEach((item) => {
            item.addEventListener("click", () => switchPage(item.dataset.page));
        });
        document.querySelectorAll(".nav-shortcut").forEach((button) => {
            button.addEventListener("click", () => switchPage(button.dataset.target));
        });
        elements.routeForm.addEventListener("submit", handleRouteSubmit);
        elements.swapStationsBtn.addEventListener("click", swapStations);
        elements.endStation.addEventListener("change", (event) => setDestination(event.target.value));
        elements.arrivalAlertBtn.addEventListener("click", () => speakArrival());
        elements.testVoiceBtn.addEventListener("click", () => speakArrival("محطة تجريبية", true));
        elements.soundToggle.addEventListener("change", (event) => {
            state.soundEnabled = event.target.checked;
            localStorage.setItem(STORAGE_KEYS.sound, String(state.soundEnabled));
            showToast(state.soundEnabled ? "تم تفعيل صوت التنبيه." : "تم إيقاف صوت التنبيه.");
        });
        elements.helpRequestBtn.addEventListener("click", handleHelpRequest);
        elements.shareLocationBtn.addEventListener("click", shareLocationSimulation);
        elements.riskAnalyzeBtn.addEventListener("click", handleRiskAnalysis);
        elements.profileForm.addEventListener("submit", saveProfile);
        elements.logoutBtn.addEventListener("click", logout);
        elements.openChatFromHome.addEventListener("click", openChat);
        elements.openChatFromProfile.addEventListener("click", openChat);
        elements.chatFab.addEventListener("click", openChat);
        elements.closeChatBtn.addEventListener("click", closeChat);
        elements.chatForm.addEventListener("submit", handleChatSubmit);
        elements.chatQuickActions.addEventListener("click", (event) => {
            const target = event.target.closest("[data-prompt]");
            if (!target) {
                return;
            }
            sendChatMessage(target.dataset.prompt);
        });
        elements.mapLayout.addEventListener("click", handleMapStationClick);
    }

    function applyLoginState() {
        const isLoggedIn = Boolean(state.user);
        elements.loginScreen.classList.toggle("hidden", isLoggedIn);
        elements.appShell.classList.toggle("hidden", !isLoggedIn);
        elements.chatFab.classList.toggle("hidden", !isLoggedIn);
        if (isLoggedIn) {
            updateWelcome();
            updateHomeMetrics();
        }
    }

    function handleLogin(event) {
        event.preventDefault();
        const name = elements.loginName.value.trim();
        const password = elements.loginPassword.value.trim();

        if (!name || !password) {
            showToast("اكتب الاسم وكلمة المرور أولًا.");
            return;
        }

        loginUser(name, elements.rememberMe.checked);
    }

    function loginUser(name, remember) {
        state.user = {
            name,
            remember,
            loggedAt: new Date().toISOString(),
        };

        if (!state.profile.name) {
            state.profile.name = name;
        }

        if (remember) {
            writeStorage(STORAGE_KEYS.login, state.user);
        } else {
            localStorage.removeItem(STORAGE_KEYS.login);
        }

        writeStorage(STORAGE_KEYS.profile, state.profile);
        updateWelcome();
        syncProfileForm();
        applyLoginState();
        switchPage("home");
        showToast(`أهلاً ${name}، التطبيق جاهز الآن.`);
    }

    function logout() {
        state.user = null;
        localStorage.removeItem(STORAGE_KEYS.login);
        closeChat();
        applyLoginState();
        showToast("تم تسجيل الخروج.");
    }

    function switchPage(page) {
        state.currentPage = page;
        elements.pages.forEach((section) => {
            section.classList.toggle("active", section.dataset.page === page);
        });
        elements.navItems.forEach((item) => {
            item.classList.toggle("active", item.dataset.page === page);
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function renderStationOptions() {
        const options = buildGroupedOptions();
        elements.startStation.innerHTML = `<option value="">اختر محطة البداية</option>${options}`;
        elements.endStation.innerHTML = `<option value="">اختر محطة الوصول</option>${options}`;
        elements.profileFavoriteStation.innerHTML = `<option value="">بدون تفضيل</option>${options}`;

        if (state.destination) {
            elements.endStation.value = state.destination;
        }

        if (state.profile.favoriteStation) {
            elements.profileFavoriteStation.value = state.profile.favoriteStation;
        }

        elements.soundToggle.checked = state.soundEnabled;
        updateVoicePanel();
    }

    function buildGroupedOptions() {
        return Object.values(metroData)
            .map((line) => {
                const options = line.stations
                    .map((station) => `<option value="${station}">${station}</option>`)
                    .join("");
                return `<optgroup label="${line.name}">${options}</optgroup>`;
            })
            .join("");
    }

    function refreshLineStatus() {
        const currentHour = new Date().getHours();
        const minuteBias = new Date().getMinutes() % 7;
        const baseCrowding = {
            line1: 58,
            line2: 62,
            line3: 49,
        };

        Object.keys(metroData).forEach((lineId, index) => {
            let crowd = baseCrowding[lineId] + minuteBias * 2 + index * 3;
            if ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 16 && currentHour <= 18)) {
                crowd += 18;
            } else if (currentHour >= 20 || currentHour <= 6) {
                crowd -= 14;
            }
            crowd = clamp(crowd, 28, 92);

            const nextTrain = clamp(2 + index + Math.round(crowd / 30), 2, 7);
            const safety = clamp(Math.round(98 - crowd * 0.45 - (index === 1 ? 5 : 0)), 54, 96);

            state.lineStatus[lineId] = {
                crowd,
                nextTrain,
                safety,
                label: crowdLabel(crowd),
            };
        });

        renderLineBoards();
        updateHomeMetrics();
        updateMapRefreshTime();
    }

    function renderLineBoards() {
        const html = Object.values(metroData)
            .map((line) => {
                const status = state.lineStatus[line.id];
                return `
                    <div class="line-status">
                        <div class="line-status-head">
                            <div style="display:flex;align-items:center;gap:10px;">
                                <span class="line-dot" style="background:${line.color}"></span>
                                <strong>${line.name}</strong>
                            </div>
                            <span>${status.label}</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill" style="width:${status.crowd}%; background:${line.color};"></div>
                        </div>
                        <div class="line-status-head">
                            <small>القطار التالي خلال ${status.nextTrain} دقائق</small>
                            <small>مؤشر الأمان ${status.safety}%</small>
                        </div>
                    </div>
                `;
            })
            .join("");

        elements.lineStatusBoard.innerHTML = html;
        elements.liveMapBoard.innerHTML = html;
    }

    function handleRouteSubmit(event) {
        event.preventDefault();
        const start = elements.startStation.value;
        const end = elements.endStation.value;

        if (!start || !end) {
            showToast("اختر محطة البداية والوجهة أولًا.");
            return;
        }

        if (start === end) {
            elements.routeResult.innerHTML = `<div class="analysis-box">أنت بالفعل في نفس المحطة. اختر وجهة مختلفة لعرض المسار.</div>`;
            setDestination(end);
            return;
        }

        const route = planBestRoute(start, end);
        if (!route) {
            elements.routeResult.innerHTML = `<div class="analysis-box">تعذر إيجاد مسار مناسب بهذه البيانات التجريبية.</div>`;
            return;
        }

        state.route = route;
        setDestination(end);
        saveRouteHistory(route);
        renderRouteResult(route);
        updateHomeMetrics();
        showToast(`تم تجهيز مسار من ${start} إلى ${end}.`);
    }

    function planBestRoute(start, end) {
        const startLines = findStationLines(start);
        const endLines = findStationLines(end);
        const candidates = [];

        startLines.forEach((startLine) => {
            endLines.forEach((endLine) => {
                if (startLine === endLine) {
                    const path = pathOnLine(startLine, start, end);
                    if (path) {
                        candidates.push(buildCandidate([segment(startLine, path)], []));
                    }
                    return;
                }

                const transfers = sharedStations(startLine, endLine);
                transfers.forEach((transfer) => {
                    const firstPath = pathOnLine(startLine, start, transfer);
                    const secondPath = pathOnLine(endLine, transfer, end);
                    if (!firstPath || !secondPath) {
                        return;
                    }
                    candidates.push(
                        buildCandidate(
                            [segment(startLine, firstPath), segment(endLine, secondPath)],
                            [transfer]
                        )
                    );
                });
            });
        });

        const unique = new Map();
        candidates.forEach((candidate) => {
            unique.set(candidate.path.join("|"), candidate);
        });

        const ranked = Array.from(unique.values()).sort((left, right) => left.score - right.score);
        return ranked[0] || null;
    }

    function buildCandidate(segments, transferStations) {
        const path = segments.flatMap((part, index) => {
            return index === 0 ? part.stations : part.stations.slice(1);
        });
        const stops = path.length - 1;
        const transferCount = transferStations.length;
        const averageCrowd = average(
            segments.map((part) => state.lineStatus[part.lineId]?.crowd || 50)
        );
        const crowdedSegment = [...segments].sort((a, b) => {
            return (state.lineStatus[a.lineId]?.crowd || 0) - (state.lineStatus[b.lineId]?.crowd || 0);
        })[0];
        const penalty = transferStations.reduce((sum, station) => sum + (transferPenalty[station] || 1), 0);
        const safetyScore = clamp(Math.round(97 - averageCrowd * 0.28 - transferCount * 9 - penalty * 3), 50, 96);
        const minutes = Math.round(stops * 2.1 + transferCount * 4 + 2);
        const score = stops * 2 + averageCrowd * 0.65 + transferCount * 9 + penalty * 4;

        return {
            segments,
            transferStations,
            path,
            stops,
            minutes,
            score,
            safetyScore,
            crowdLabel: crowdLabel(averageCrowd),
            crowdValue: Math.round(averageCrowd),
            leastCrowdedLine: metroData[crowdedSegment.lineId].name,
        };
    }

    function renderRouteResult(route) {
        const transferText = route.transferStations.length
            ? route.transferStations.join("، ")
            : "بدون تبديل";

        const stepsHtml = route.segments
            .map((segmentData, index) => {
                const line = metroData[segmentData.lineId];
                const start = segmentData.stations[0];
                const end = segmentData.stations[segmentData.stations.length - 1];
                const transferNote =
                    route.transferStations[index] ?
                        `بدّل في محطة ${route.transferStations[index]}` :
                        "استمر حتى الوجهة";

                return `
                    <div class="route-step">
                        <div>
                            <strong>${line.name}</strong>
                            <span>من ${start} إلى ${end}</span>
                        </div>
                        <small>${transferNote}</small>
                    </div>
                `;
            })
            .join("");

        const pathHtml = route.path
            .map((station) => {
                if (route.transferStations.includes(station)) {
                    return `<mark>${station}</mark>`;
                }
                return station;
            })
            .join(" ← ");

        elements.routeResult.innerHTML = `
            <div class="route-result">
                <div class="route-badges">
                    <span class="metric-chip success">⏱️ ${route.minutes} دقيقة تقريبًا</span>
                    <span class="metric-chip">🔁 محطة التبديل: ${transferText}</span>
                    <span class="metric-chip warning">👥 الازدحام: ${route.crowdLabel}</span>
                    <span class="metric-chip success">🛡️ الأمان: ${route.safetyScore}%</span>
                </div>

                <div class="route-steps">${stepsHtml}</div>

                <div class="route-path">
                    <strong>تسلسل المحطات:</strong><br>
                    ${pathHtml}
                </div>

                <div class="route-advice">
                    <strong>توصية ذكية:</strong>
                    تم اختيار هذا المسار لأنه يوازن بين عدد المحطات، عدد التبديلات، وكثافة الازدحام الحالية.
                    الخط الأقل ازدحامًا داخل الرحلة الآن هو <strong>${route.leastCrowdedLine}</strong>.
                    إذا شعرت بعدم الارتياح فاختر العربة الأقرب للسائق أو انتظر القطار التالي إن كان الازدحام مرتفعًا.
                </div>
            </div>
        `;
    }

    function swapStations() {
        const currentStart = elements.startStation.value;
        const currentEnd = elements.endStation.value;
        elements.startStation.value = currentEnd;
        elements.endStation.value = currentStart;
        if (currentStart) {
            setDestination(currentStart);
        }
    }

    function setDestination(destination) {
        state.destination = destination;
        if (destination) {
            localStorage.setItem(STORAGE_KEYS.destination, destination);
        } else {
            localStorage.removeItem(STORAGE_KEYS.destination);
        }
        elements.endStation.value = destination;
        updateVoicePanel();
        renderMap();
        updateHomeMetrics();
    }

    function updateVoicePanel() {
        const destinationText = state.destination || "الوجهة غير محددة";
        elements.currentDestinationLabel.textContent = destinationText;
        elements.voiceDestinationStatus.textContent = state.destination ? `الوجهة: ${state.destination}` : "الوجهة غير محددة";
        updateVoiceStatus(
            state.destination
                ? `الرسالة الجاهزة: لقد وصلت إلى محطة ${state.destination}`
                : 'اختر محطة وصول أولًا لتفعيل الرسالة: "لقد وصلت إلى محطة ..."'
        );
    }

    function updateVoiceStatus(message) {
        elements.voiceFeedback.textContent = message;
    }

    async function speakArrival(customStation, isTest = false) {
        const targetStation = customStation || state.destination;
        if (!targetStation) {
            updateVoiceStatus("لم يتم اختيار محطة وصول بعد.");
            showToast("حدد وجهة أولًا ثم جرّب التنبيه.");
            return;
        }

        const message = `لقد وصلت إلى محطة ${targetStation}`;
        if (state.soundEnabled) {
            await playAlertChime();
        }
        if (state.profile.vibration && navigator.vibrate) {
            navigator.vibrate([180, 120, 280]);
        }
        speakArabic(message);
        updateVoiceStatus(isTest ? `تم تشغيل معاينة صوتية لمحطة ${targetStation}.` : `تم تشغيل تنبيه الوصول لمحطة ${targetStation}.`);
    }

    function speakArabic(text) {
        if (!("speechSynthesis" in window)) {
            showToast("المتصفح لا يدعم SpeechSynthesis.");
            return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice =
            voices.find((voice) => voice.lang === "ar-EG") ||
            voices.find((voice) => voice.lang?.startsWith("ar")) ||
            null;

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang;
        } else {
            utterance.lang = "ar-EG";
        }

        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.volume = 1;

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }

    function playAlertChime() {
        return new Promise((resolve) => {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) {
                resolve();
                return;
            }

            const audioContext = new AudioCtx();
            const now = audioContext.currentTime;
            const notes = [
                { frequency: 740, start: now, duration: 0.11 },
                { frequency: 988, start: now + 0.12, duration: 0.16 },
            ];

            notes.forEach((note) => {
                const oscillator = audioContext.createOscillator();
                const gain = audioContext.createGain();
                oscillator.frequency.value = note.frequency;
                oscillator.type = "sine";
                gain.gain.setValueAtTime(0.0001, note.start);
                gain.gain.exponentialRampToValueAtTime(0.12, note.start + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, note.start + note.duration);
                oscillator.connect(gain);
                gain.connect(audioContext.destination);
                oscillator.start(note.start);
                oscillator.stop(note.start + note.duration);
            });

            setTimeout(() => {
                audioContext.close().catch(() => {});
                resolve();
            }, 460);
        });
    }

    function renderMap() {
        const transferStations = getAllTransferStations();
        elements.mapLayout.innerHTML = Object.values(metroData)
            .map((line) => {
                const stationsHtml = line.stations
                    .map((station) => {
                        const classes = [
                            "map-station",
                            transferStations.has(station) ? "transfer" : "",
                            station === state.destination ? "destination" : "",
                        ]
                            .filter(Boolean)
                            .join(" ");
                        const rightLabel = station === state.destination
                            ? "وجهة التنبيه"
                            : transferStations.has(station)
                                ? "تبديل"
                                : "محطة";
                        return `
                            <button class="${classes}" type="button" data-station="${station}">
                                <span>${station}</span>
                                <small>${rightLabel}</small>
                            </button>
                        `;
                    })
                    .join("");

                return `
                    <article class="map-line" style="--line-color:${line.color}">
                        <div class="map-line-head">
                            <strong>${line.name}</strong>
                            <span class="soft-badge">${state.lineStatus[line.id]?.label || "معتدل"}</span>
                        </div>
                        <div class="map-line-stations">${stationsHtml}</div>
                    </article>
                `;
            })
            .join("");
    }

    function handleMapStationClick(event) {
        const stationButton = event.target.closest("[data-station]");
        if (!stationButton) {
            return;
        }
        const station = stationButton.dataset.station;
        setDestination(station);
        showToast(`تم اختيار ${station} كوجهة للتنبيه.`);
    }

    function renderSafePlaces() {
        elements.safePlacesList.innerHTML = emergencyPoints
            .map((place) => {
                return `
                    <article class="safe-place">
                        <div class="safe-head">
                            <strong>${place.name}</strong>
                            <span class="soft-badge">${place.eta}</span>
                        </div>
                        <p>قرب محطة ${place.station}</p>
                        <p>${place.details}</p>
                    </article>
                `;
            })
            .join("");
    }

    function handleHelpRequest() {
        const focusStation = state.destination || state.route?.path?.slice(-1)[0] || state.profile.favoriteStation || "السادات";
        const now = new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
        elements.helpStatus.innerHTML = `
            <strong>تم إرسال تنبيه تجريبي بنجاح</strong><br>
            المحطة المرجعية: ${focusStation}<br>
            وقت الإرسال: ${now}<br>
            ${state.profile.emergencyPhone ? `تم تجهيز جهة الاتصال: ${state.profile.emergencyPhone}` : "لا توجد جهة اتصال محفوظة بعد."}
        `;
        if (navigator.vibrate) {
            navigator.vibrate([220, 100, 220, 100, 320]);
        }
        showToast("تم إرسال طلب المساعدة التجريبي.");
    }

    function shareLocationSimulation() {
        const station = state.destination || state.route?.path?.slice(-1)[0] || "أقرب محطة غير محددة";
        elements.helpStatus.innerHTML = `
            <strong>مشاركة موقع محاكية</strong><br>
            تم تجهيز رابط مشاركة وهمي عند محطة ${station}.<br>
            يمكنك استخدام هذه الشاشة كمرجع سريع أثناء الطوارئ.
        `;
        showToast("تم تحديث موقع الرحلة الحالي.");
    }

    function handleRiskAnalysis() {
        const text = elements.riskInput.value.trim();
        if (!text) {
            showToast("اكتب وصفًا بسيطًا للموقف أولًا.");
            return;
        }
        const analysis = analyzeRisk(text);
        elements.riskResult.innerHTML = `
            <strong>مستوى الخطورة: ${analysis.levelLabel}</strong><br>
            ${analysis.summary}<br><br>
            <strong>الإجراء المقترح:</strong> ${analysis.action}
        `;
        if (analysis.level === "high") {
            showToast("تم رصد حالة عالية الخطورة. استخدم زر طلب المساعدة.");
        }
    }

    function analyzeRisk(text) {
        const normalized = text.toLowerCase();
        const severeKeywords = ["تحرش", "بيتحرش", "ملاحق", "بيتبعني", "اعتداء", "يلمس", "بخطر", "صرخة"];
        const mediumKeywords = ["خايف", "قلقان", "مضايقة", "مش مرتاح", "زحمة", "مريب", "لوحدي"];

        const severe = severeKeywords.some((keyword) => normalized.includes(keyword));
        const medium = mediumKeywords.some((keyword) => normalized.includes(keyword));

        if (severe) {
            return {
                level: "high",
                levelLabel: "عالٍ",
                summary: "الوصف يشير إلى موقف يستدعي تدخلًا سريعًا أو الانتقال الفوري إلى نقطة آمنة.",
                action: "تحرك فورًا نحو أقرب نقطة شرطة أو استعلامات، وفعّل طلب المساعدة وشارك موقعك.",
            };
        }

        if (medium) {
            return {
                level: "medium",
                levelLabel: "متوسط",
                summary: "هناك مؤشرات على عدم راحة أو احتمالية تصاعد الموقف داخل المحطة أو العربة.",
                action: "غيّر مكانك إلى عربة أكثر أمانًا أو قرب السائق، وابقَ بالقرب من مجموعات أو موظفي المحطة.",
            };
        }

        return {
            level: "low",
            levelLabel: "منخفض",
            summary: "الموقف غير واضح كخطر مباشر، لكن من الجيد الاستمرار في المراقبة واتباع إجراءات الاحتياط.",
            action: "ابق قريبًا من الممرات المضيئة، واحتفظ بزر المساعدة جاهزًا إذا تغير الوضع.",
        };
    }

    function saveProfile(event) {
        event.preventDefault();
        state.profile = {
            name: elements.profileName.value.trim(),
            emergencyPhone: elements.profileEmergencyPhone.value.trim(),
            favoriteStation: elements.profileFavoriteStation.value,
            vibration: elements.profileVibrationToggle.checked,
        };
        writeStorage(STORAGE_KEYS.profile, state.profile);
        updateWelcome();
        syncProfileForm();
        showToast("تم حفظ بيانات الملف الشخصي.");
    }

    function syncProfileForm() {
        elements.profileName.value = state.profile.name || state.user?.name || "";
        elements.profileEmergencyPhone.value = state.profile.emergencyPhone || "";
        elements.profileFavoriteStation.value = state.profile.favoriteStation || "";
        elements.profileVibrationToggle.checked = state.profile.vibration;

        const summaryRows = [
            ["الاسم", state.profile.name || state.user?.name || "غير محدد"],
            ["جهة الطوارئ", state.profile.emergencyPhone || "غير محفوظة"],
            ["المحطة المفضلة", state.profile.favoriteStation || "لا يوجد"],
            ["تنبيه الاهتزاز", state.profile.vibration ? "مفعل" : "متوقف"],
            ["عدد الرحلات المحفوظة", String(state.history.length)],
        ];

        elements.profileSummary.innerHTML = summaryRows
            .map(([label, value]) => {
                return `
                    <div class="summary-row">
                        <span>${label}</span>
                        <strong>${value}</strong>
                    </div>
                `;
            })
            .join("");
    }

    function updateHomeMetrics() {
        const bestLine = Object.entries(state.lineStatus).sort((left, right) => left[1].crowd - right[1].crowd)[0];
        if (bestLine) {
            const line = metroData[bestLine[0]];
            elements.leastCrowdedNow.textContent = `${line.name} - ${bestLine[1].label}`;
            elements.leastCrowdedTime.textContent = `القطار التالي خلال ${bestLine[1].nextTrain} دقائق تقريبًا`;
        }

        elements.currentDestinationLabel.textContent = state.destination || "لم يتم الاختيار بعد";

        if (state.route) {
            elements.lastRouteSummary.textContent = `${state.route.path[0]} ← ${state.route.path[state.route.path.length - 1]}`;
            elements.lastRouteMeta.textContent = `${state.route.minutes} دقيقة • ${state.route.transferStations.length ? `تبديل عند ${state.route.transferStations.join("، ")}` : "بدون تبديل"}`;
        } else {
            elements.lastRouteSummary.textContent = "لم يتم التخطيط بعد";
            elements.lastRouteMeta.textContent = "اختر محطة البداية والوجهة";
        }
    }

    function updateWelcome() {
        const displayName = state.profile.name || state.user?.name || "المستخدم";
        elements.welcomeText.textContent = `${displayName}، استخدم الأدوات الذكية لمعرفة أفضل مسار، تنبيه الوصول، وإجراءات السلامة أثناء الرحلة.`;
        syncProfileForm();
    }

    function openChat() {
        elements.chatPanel.classList.remove("hidden");
        elements.chatInput.focus();
    }

    function closeChat() {
        elements.chatPanel.classList.add("hidden");
    }

    function handleChatSubmit(event) {
        event.preventDefault();
        const text = elements.chatInput.value.trim();
        if (!text) {
            return;
        }
        sendChatMessage(text);
        elements.chatInput.value = "";
    }

    function ensureWelcomeMessage() {
        if (elements.chatMessages.children.length > 0) {
            return;
        }
        appendChatBubble(
            "bot",
            "أنا المساعد الذكي في رفيق المترو. اسألني عن المسار، الازدحام، أقرب نقطة آمنة، أو ماذا تفعل إذا شعرت بالخطر."
        );
    }

    function sendChatMessage(text) {
        appendChatBubble("user", text);
        const reply = generateChatReply(text);
        window.setTimeout(() => appendChatBubble("bot", reply), 260);
    }

    function generateChatReply(text) {
        const normalized = text.toLowerCase();
        const safePoint = emergencyPoints[0];
        const leastBusy = Object.entries(state.lineStatus).sort((left, right) => left[1].crowd - right[1].crowd)[0];
        const leastBusyLine = leastBusy ? `${metroData[leastBusy[0]].name} وهو ${leastBusy[1].label}` : "المؤشر ما زال يتحدث";

        if (normalized.includes("خطر") || normalized.includes("تحرش") || normalized.includes("بيتبعني") || normalized.includes("مضايقة")) {
            switchPage("emergency");
            return "إذا كنت تشعر بخطر الآن، انتقل فورًا إلى مكان مضيء أو قريب من موظفي المحطة، ثم استخدم زر طلب مساعدة في صفحة الطوارئ. أقرب نقطة آمنة مقترحة حاليًا هي " + safePoint.name + ".";
        }

        if (normalized.includes("أركب") || normalized.includes("منين") || normalized.includes("مسار")) {
            if (state.route) {
                return `آخر مسار حسبته لك هو من ${state.route.path[0]} إلى ${state.route.path[state.route.path.length - 1]} ويستغرق حوالي ${state.route.minutes} دقيقة. إذا أردت مسارًا جديدًا افتح صفحة المسار واختر المحطتين.`;
            }
            switchPage("planner");
            return "افتح صفحة المسار وحدد محطة البداية والوجهة، وسأعرض لك أفضل طريق مع الوقت ومحطة التبديل ومستوى الازدحام.";
        }

        if (normalized.includes("أقرب محطة")) {
            return state.profile.favoriteStation
                ? `بما أن محطتك المفضلة المحفوظة هي ${state.profile.favoriteStation}، يمكنك البدء منها أو منهاجها كنقطة مرجعية. إذا أردت تحديد محطة فعلية حولك فهذه النسخة تعمل بمحاكاة محلية وليست مرتبطة بالموقع الجغرافي الحقيقي.`
                : "هذه النسخة تعمل بمحاكاة محلية، لذلك لا تحدد موقعك الحقيقي. يمكنك استخدام صفحة الخريطة لاستعراض أقرب المحطات يدويًا وتعيين وجهتك بسرعة.";
        }

        if (normalized.includes("زحمة") || normalized.includes("أقل خط")) {
            return `أقل خط ازدحامًا الآن هو ${leastBusyLine}. لو أردت رحلة أكثر هدوءًا، جرّب الانتظار القطار التالي أو اختر العربة الأولى أو الأخيرة.`;
        }

        if (normalized.includes("تنبيه") || normalized.includes("وصلت")) {
            switchPage("planner");
            return state.destination
                ? `تم حفظ وجهتك الحالية وهي ${state.destination}. يمكنك الآن الضغط على زر "🔊 تنبيه الوصول" لتشغيل الرسالة الصوتية.`
                : 'حدد محطة الوصول أولًا في صفحة المسار، وبعدها استخدم زر "🔊 تنبيه الوصول" لتشغيل الرسالة الصوتية بالعربية.';
        }

        if (normalized.includes("مساعدة") || normalized.includes("شرطة") || normalized.includes("آمنة")) {
            switchPage("emergency");
            return `أقرب نقطة مساعدة مقترحة في هذه المحاكاة هي ${safePoint.name} قرب محطة ${safePoint.station}. يمكنك أيضًا فتح صفحة الطوارئ لعرض كل الأماكن الآمنة وطلب المساعدة.`;
        }

        return "أستطيع مساعدتك في التخطيط للمسار، معرفة أقل الخطوط ازدحامًا، تشغيل تنبيه الوصول، أو اقتراح تصرفات آمنة إذا شعرت بالتوتر داخل المترو.";
    }

    function appendChatBubble(sender, text) {
        const bubble = document.createElement("div");
        bubble.className = `chat-bubble ${sender}`;
        bubble.innerHTML = `<div class="bubble">${text}</div>`;
        elements.chatMessages.appendChild(bubble);
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }

    function saveRouteHistory(route) {
        const item = {
            from: route.path[0],
            to: route.path[route.path.length - 1],
            transfer: route.transferStations.join("، ") || "بدون",
            minutes: route.minutes,
            timestamp: new Date().toLocaleString("ar-EG"),
        };

        state.history = [item, ...state.history].slice(0, 5);
        writeStorage(STORAGE_KEYS.history, state.history);
        syncProfileForm();
    }

    function startClock() {
        const updateClock = () => {
            elements.liveClock.textContent = new Date().toLocaleString("ar-EG", {
                weekday: "long",
                hour: "2-digit",
                minute: "2-digit",
            });
        };
        updateClock();
        setInterval(updateClock, 1000 * 30);
    }

    function updateMapRefreshTime() {
        elements.mapRefreshLabel.textContent = `آخر تحديث ${new Date().toLocaleTimeString("ar-EG", {
            hour: "2-digit",
            minute: "2-digit",
        })}`;
    }

    function readStorage(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function writeStorage(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function findStationLines(stationName) {
        return Object.values(metroData)
            .filter((line) => line.stations.includes(stationName))
            .map((line) => line.id);
    }

    function sharedStations(lineA, lineB) {
        const setB = new Set(metroData[lineB].stations);
        return metroData[lineA].stations.filter((station) => setB.has(station));
    }

    function pathOnLine(lineId, start, end) {
        const stations = metroData[lineId].stations;
        const startIndex = stations.indexOf(start);
        const endIndex = stations.indexOf(end);
        if (startIndex === -1 || endIndex === -1) {
            return null;
        }
        return startIndex <= endIndex
            ? stations.slice(startIndex, endIndex + 1)
            : stations.slice(endIndex, startIndex + 1).reverse();
    }

    function segment(lineId, stations) {
        return { lineId, stations };
    }

    function getAllTransferStations() {
        const counts = {};
        Object.values(metroData).forEach((line) => {
            line.stations.forEach((station) => {
                counts[station] = (counts[station] || 0) + 1;
            });
        });
        return new Set(Object.keys(counts).filter((station) => counts[station] > 1));
    }

    function crowdLabel(value) {
        if (value >= 78) {
            return "مرتفع";
        }
        if (value >= 55) {
            return "متوسط";
        }
        return "منخفض";
    }

    function average(values) {
        return values.reduce((sum, value) => sum + value, 0) / values.length;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function showToast(message) {
        const item = document.createElement("div");
        item.className = "toast";
        item.textContent = message;
        elements.toastStack.appendChild(item);
        setTimeout(() => {
            item.remove();
        }, 2800);
    }
})();
