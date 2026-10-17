import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import {
  Smartphone,
  Code2,
  ShieldCheck,
  Download,
  Copy,
  Check,
  Send,
  Image as ImageIcon,
  Smile,
  Search,
  MoreVertical,
  CheckCheck,
  User as UserIcon,
  Users,
  Settings as SettingsIcon,
  LogOut,
  ArrowLeft,
  Paperclip,
  Wifi,
  WifiOff,
  Battery,
  FileCode,
  Flame,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Plus,
  ShieldAlert,
  Trash2
} from 'lucide-react';
import { ANDROID_PROJECT_FILES, ProjectFile } from './data/androidProjectFiles';

// Simulated Users for Multi-Device Cross-Testing
interface TestUser {
  uid: string;
  displayName: string;
  searchableUsername: string;
  email: string;
  photoUrl: string;
  status: string;
}

const TEST_USERS: TestUser[] = [
  {
    uid: 'user_lakshmi_101',
    displayName: 'Lakshmi Gellu',
    searchableUsername: 'lakshmi',
    email: 'lakshmigellu2@gmail.com',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    status: 'Building Mitra Chat on Android!'
  },
  {
    uid: 'user_aarav_202',
    displayName: 'Aarav Patel',
    searchableUsername: 'aarav',
    email: 'aarav.patel@example.com',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    status: 'Exploring Kotlin & Jetpack Compose 🚀'
  },
  {
    uid: 'user_priya_303',
    displayName: 'Priya Sharma',
    searchableUsername: 'priya',
    email: 'priya.sharma@example.com',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    status: 'Available • Material 3 enthusiast'
  }
];

interface SimMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  mediaUrl?: string;
  time: string;
  status: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ';
}

interface SimConversation {
  id: string;
  participantIds: string[];
  title: string;
  photoUrl?: string;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageSenderId: string;
  unreadCount: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'code' | 'firebase'>('simulator');
  const [activeUserIndex, setActiveUserIndex] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [downloadingZip, setDownloadingZip] = useState<boolean>(false);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<ProjectFile>(ANDROID_PROJECT_FILES[0]);

  // Android Device Simulator State
  const [simScreen, setSimScreen] = useState<'auth' | 'home' | 'chat' | 'profile'>('home');
  const [simActiveTab, setSimActiveTab] = useState<'chats' | 'contacts' | 'settings'>('chats');
  const [activeConvId, setActiveConvId] = useState<string>('direct_lakshmi_aarav');
  const [inputText, setInputText] = useState<string>('');
  const [contactQuery, setContactQuery] = useState<string>('');
  const [profileName, setProfileName] = useState<string>(TEST_USERS[0].displayName);
  const [profileStatus, setProfileStatus] = useState<string>(TEST_USERS[0].status);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const currentUser = TEST_USERS[activeUserIndex];

  // Simulated Shared Firestore Database State
  const [messages, setMessages] = useState<SimMessage[]>([
    {
      id: 'm1',
      conversationId: 'direct_lakshmi_aarav',
      senderId: 'user_aarav_202',
      senderName: 'Aarav Patel',
      text: 'Hey Lakshmi! Welcome to Mitra Chat! Did you set up the native Android project?',
      time: '10:14 AM',
      status: 'READ'
    },
    {
      id: 'm2',
      conversationId: 'direct_lakshmi_aarav',
      senderId: 'user_lakshmi_101',
      senderName: 'Lakshmi Gellu',
      text: 'Yes! Built with Kotlin, Jetpack Compose, Material 3 and Firebase Auth with Google Sign-In. No phone numbers required!',
      time: '10:15 AM',
      status: 'READ'
    },
    {
      id: 'm3',
      conversationId: 'direct_lakshmi_aarav',
      senderId: 'user_aarav_202',
      senderName: 'Aarav Patel',
      text: 'Awesome! Real-time Cloud Firestore synchronization and push notifications look fantastic.',
      time: '10:16 AM',
      status: 'READ'
    },
    {
      id: 'm4',
      conversationId: 'direct_lakshmi_priya',
      senderId: 'user_priya_303',
      senderName: 'Priya Sharma',
      text: 'Hi Lakshmi! Excited to test one-to-one native messaging!',
      time: '9:30 AM',
      status: 'READ'
    }
  ]);

  const [conversations, setConversations] = useState<SimConversation[]>([
    {
      id: 'direct_lakshmi_aarav',
      participantIds: ['user_lakshmi_101', 'user_aarav_202'],
      title: 'Aarav Patel',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      lastMessage: 'Awesome! Real-time Cloud Firestore synchronization and push notifications look fantastic.',
      lastMessageTime: '10:16 AM',
      lastMessageSenderId: 'user_aarav_202',
      unreadCount: 0
    },
    {
      id: 'direct_lakshmi_priya',
      participantIds: ['user_lakshmi_101', 'user_priya_303'],
      title: 'Priya Sharma',
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      lastMessage: 'Hi Lakshmi! Excited to test one-to-one native messaging!',
      lastMessageTime: '9:30 AM',
      lastMessageSenderId: 'user_priya_303',
      unreadCount: 1
    }
  ]);

  // Sync profile edits
  useEffect(() => {
    setProfileName(currentUser.displayName);
    setProfileStatus(currentUser.status);
  }, [activeUserIndex]);

  // Download complete Android Project ZIP
  const handleDownloadZip = async () => {
    try {
      setDownloadingZip(true);
      const zip = new JSZip();

      // Add all project files
      ANDROID_PROJECT_FILES.forEach((file) => {
        zip.file(file.path, file.content);
      });

      // Add supplemental files
      zip.file('FIREBASE_SETUP_GUIDE.md', '# Mitra Chat Android Setup\n\nRefer to root guide.');
      zip.file('android/gradle.properties', 'org.gradle.jvmargs=-Xmx2048m\nandroid.useAndroidX=true\n');
      zip.file(
        'android/app/google-services.json',
        JSON.stringify(
          {
            project_info: {
              project_number: '374258828263',
              project_id: 'project-374258828263',
              storage_bucket: 'project-374258828263.appspot.com'
            },
            client: [
              {
                client_info: {
                  mobilesdk_app_id: '1:374258828263:android:0c87361c7cbcab4570f342',
                  android_client_info: { package_name: 'com.mitrachat.app' }
                },
                oauth_client: [
                  {
                    client_id: '374258828263-xxxxxxxxxxxxxxxx.apps.googleusercontent.com',
                    client_type: 3
                  }
                ],
                api_key: [{ current_key: 'AIzaSyDummyKeyForBuildVerificationOnly' }],
                services: { appinvite_service: { other_platform_oauth_client: [] } }
              }
            ],
            configuration_version: '1'
          },
          null,
          2
        )
      );
      zip.file(
        '.github/workflows/android-build.yml',
        `name: Build Mitra Chat Android APK

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build:
    name: Build Android Debug APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'
          cache: 'gradle'

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: '8.10.2'

      - name: Prepare Android Project & Firebase Config
        run: |
          if [ -d "android" ]; then
            PROJECT_DIR="android"
          else
            PROJECT_DIR="."
          fi
          echo "PROJECT_DIR=$PROJECT_DIR" >> $GITHUB_ENV

          mkdir -p "$PROJECT_DIR/app"

          if [ ! -f "$PROJECT_DIR/app/google-services.json" ]; then
            if [ -f "$PROJECT_DIR/google-services.json" ]; then
              cp "$PROJECT_DIR/google-services.json" "$PROJECT_DIR/app/google-services.json"
            elif [ -f "google-services.json" ]; then
              cp "google-services.json" "$PROJECT_DIR/app/google-services.json"
            elif [ -f "$PROJECT_DIR/app/google-services.json.template" ]; then
              cp "$PROJECT_DIR/app/google-services.json.template" "$PROJECT_DIR/app/google-services.json"
            fi
          fi

          yes | sdkmanager --licenses || true

      - name: Build Debug APK
        run: |
          cd $PROJECT_DIR
          gradle assembleDebug --no-daemon --stacktrace

      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: mitra-chat-debug-apk
          path: '**/build/outputs/apk/debug/*.apk'
          retention-days: 14
`
      );
      zip.file(
        'android/app/src/main/res/drawable/ic_launcher_background.xml',
        `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path android:fillColor="#008069" android:pathData="M0,0h108v108h-108z" />
</vector>`
      );
      zip.file(
        'android/app/src/main/res/drawable/ic_launcher_foreground.xml',
        `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path android:fillColor="#FFFFFF" android:pathData="M54,24C37.4,24 24,37.4 24,54c0,5.8 1.6,11.2 4.4,15.8L24,84l14.6,-4.2c4.4,2.6 9.6,4.2 15.4,4.2c16.6,0 30,-13.4 30,-30S70.6,24 54,24zM54,78c-4.8,0-9.2,-1.4-13,-3.8l-1,-0.6 -9.6,2.8 2.8,-9.4 -0.6,-1C30.2,62.2 29,58.2 29,54c0,-13.8 11.2,-25 25,-25s25,11.2 25,25S67.8,78 54,78z" />
</vector>`
      );
      zip.file(
        'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
        `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>`
      );
      zip.file(
        'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml',
        `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mitra-chat-android-project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generating zip:', e);
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleCopyCode = (text: string, path: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(path);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  // Send message simulation
  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMsg: SimMessage = {
      id: `m_${Date.now()}`,
      conversationId: activeConvId,
      senderId: currentUser.uid,
      senderName: currentUser.displayName,
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: isOnline ? 'READ' : 'SENDING'
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Update conversation last message
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? {
              ...c,
              lastMessage: newMsg.text,
              lastMessageTime: newMsg.time,
              lastMessageSenderId: currentUser.uid,
              unreadCount: 0
            }
          : c
      )
    );
  };

  // Switch conversation participant resolution
  const activeConversation = conversations.find((c) => c.id === activeConvId);
  const otherParticipant = TEST_USERS.find(
    (u) => activeConversation?.participantIds.includes(u.uid) && u.uid !== currentUser.uid
  ) || TEST_USERS[1];

  const currentChatMessages = messages.filter((m) => m.conversationId === activeConvId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header / Studio Toolbar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur px-3 sm:px-6 py-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg text-white tracking-tight truncate">Mitra Chat</h1>
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/30 whitespace-nowrap">
                Native Android • Material 3
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate">
              Kotlin • Jetpack Compose • Firebase Google Sign-In • Cloud Firestore
            </p>
          </div>
        </div>

        {/* Center Mode Switcher (Horizontal scroll on mobile) */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700/60 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'simulator'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Device Simulator
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'code'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Source Code ({ANDROID_PROJECT_FILES.length})
          </button>
          <button
            onClick={() => setActiveTab('firebase')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'firebase'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Firebase & Mobile Guide
          </button>
        </div>

        {/* Right CTA: Download Android Project Zip */}
        <button
          onClick={handleDownloadZip}
          disabled={downloadingZip}
          className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer shrink-0"
        >
          {downloadingZip ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Download Project (.ZIP)
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-3 sm:p-6 max-w-7xl w-full mx-auto">
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Left Column: Device Control Panel & Cross-Device Switcher */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <h2 className="font-semibold text-sm text-white">Cross-Device Switcher</h2>
                  </div>
                  <span className="text-xs text-slate-400">Switch sender identity</span>
                </div>

                <p className="text-xs text-slate-400 mt-3 mb-4">
                  Test real-time one-to-one communication across multiple distinct Android devices:
                </p>

                <div className="space-y-2">
                  {TEST_USERS.map((user, idx) => (
                    <button
                      key={user.uid}
                      onClick={() => setActiveUserIndex(idx)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                        activeUserIndex === idx
                          ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/50'
                          : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={user.photoUrl}
                          alt={user.displayName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-700"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white">
                              {user.displayName}
                            </span>
                            {activeUserIndex === idx && (
                              <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full">
                                Active Device
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">@{user.searchableUsername}</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {user.uid.replace('user_', '')}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Device Controls: Online/Offline Simulation */}
                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isOnline ? (
                      <Wifi className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-rose-400" />
                    )}
                    <span className="text-xs font-medium text-slate-300">
                      Network: {isOnline ? 'Online (Connected)' : 'Offline (Simulated)'}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsOnline(!isOnline)}
                    className={`text-xs px-3 py-1 rounded-lg border font-medium transition-all ${
                      isOnline
                        ? 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                        : 'bg-rose-950/50 text-rose-300 border-rose-800'
                    }`}
                  >
                    Toggle {isOnline ? 'Offline' : 'Online'}
                  </button>
                </div>
              </div>

              {/* Architectural Highlights Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Production Architecture Enforced
                </h3>
                <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                  <li>
                    <strong className="text-white">No Phone Number:</strong> Google Sign-In with
                    Android Credential Manager & Firebase Auth.
                  </li>
                  <li>
                    <strong className="text-white">Permanent Firebase UID:</strong> Verified in
                    Firestore rules for all ownership checks.
                  </li>
                  <li>
                    <strong className="text-white">Privacy Guard:</strong> User discovery via{' '}
                    <code className="text-emerald-300 bg-slate-800 px-1 py-0.5 rounded">
                      searchableUsername
                    </code>{' '}
                    without exposing emails.
                  </li>
                  <li>
                    <strong className="text-white">Real-Time State:</strong> Kotlin Coroutines Flow +
                    Firestore Snapshots with delivered/read receipts.
                  </li>
                  <li>
                    <strong className="text-white">Zero Hardcoded Secrets:</strong> FCM server-side
                    Cloud Functions with Firebase Admin SDK.
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column: Pixel 8 Android Device Frame */}
            <div className="lg:col-span-7 flex justify-center w-full">
              <div className="w-full max-w-[380px] h-[680px] sm:h-[720px] bg-slate-900 rounded-[32px] sm:rounded-[44px] p-1.5 sm:p-3 shadow-2xl border-2 sm:border-4 border-slate-700/80 relative flex flex-col overflow-hidden ring-1 ring-slate-800">
                {/* Android Status Bar */}
                <div className="h-7 w-full flex items-center justify-between px-6 text-[11px] text-white/90 font-medium z-20 select-none bg-emerald-900/60 backdrop-blur-sm">
                  <span>10:18</span>
                  {/* Camera Hole Punch */}
                  <div className="w-3.5 h-3.5 bg-black rounded-full border border-slate-700/60"></div>
                  <div className="flex items-center gap-1.5">
                    {isOnline ? <Wifi className="w-3 h-3 text-white" /> : <WifiOff className="w-3 h-3 text-rose-300" />}
                    <Battery className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>

                {/* Device Screen Interior */}
                <div className="flex-1 bg-slate-950 flex flex-col relative overflow-hidden rounded-[32px]">
                  {/* Offline Warning Banner */}
                  {!isOnline && (
                    <div className="bg-amber-600 text-white text-[11px] px-3 py-1 flex items-center justify-center gap-1.5 font-medium z-30">
                      <WifiOff className="w-3 h-3" />
                      Waiting for connection... Messages will sync once online.
                    </div>
                  )}

                  {/* 1. AUTH SCREEN */}
                  {simScreen === 'auth' && (
                    <div className="flex-1 flex flex-col justify-between p-6 bg-slate-900 text-center">
                      <div className="pt-12">
                        <div className="w-20 h-20 rounded-full bg-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-600/30">
                          <Smartphone className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mt-4">Mitra Chat</h2>
                        <p className="text-xs text-slate-400 mt-2 px-4">
                          Native Android messaging powered by Jetpack Compose & Material 3.
                        </p>
                      </div>

                      <div className="space-y-3 pb-8">
                        <button
                          onClick={() => setSimScreen('home')}
                          className="w-full py-3 px-4 rounded-full bg-white text-slate-900 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-100 transition-all shadow-md"
                        >
                          <span className="text-lg font-black text-rose-500">G</span>
                          Continue with Google
                        </button>
                        <p className="text-[10px] text-slate-500">
                          No phone number required. Uses Android Credential Manager.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 2. HOME SCREEN */}
                  {simScreen === 'home' && (
                    <div className="flex-1 flex flex-col bg-slate-950">
                      {/* Top App Bar */}
                      <div className="bg-[#008069] text-white px-4 py-3 shadow-md flex items-center justify-between">
                        {showSearch ? (
                          <div className="flex items-center gap-2 w-full">
                            <input
                              type="text"
                              value={searchFilter}
                              onChange={(e) => setSearchFilter(e.target.value)}
                              placeholder="Search chats..."
                              className="w-full bg-emerald-800/60 text-white text-xs px-3 py-1.5 rounded-full placeholder:text-white/60 focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => {
                                setShowSearch(false);
                                setSearchFilter('');
                              }}
                              className="text-white/80 hover:text-white"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                            <h2 className="font-bold text-base tracking-wide">Mitra Chat</h2>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setShowSearch(true)}
                                className="text-white/90 hover:text-white"
                              >
                                <Search className="w-4 h-4" />
                              </button>
                              <div className="relative">
                                <button
                                  onClick={() => setShowMenu(!showMenu)}
                                  className="text-white/90 hover:text-white"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                {showMenu && (
                                  <div className="absolute right-0 mt-2 w-40 bg-slate-800 rounded-xl shadow-xl border border-slate-700 py-1.5 z-40 text-xs">
                                    <button
                                      onClick={() => {
                                        setShowMenu(false);
                                        setSimScreen('profile');
                                      }}
                                      className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700"
                                    >
                                      Profile Settings
                                    </button>
                                    <button
                                      onClick={() => {
                                        setShowMenu(false);
                                        setSimActiveTab('contacts');
                                      }}
                                      className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700"
                                    >
                                      Find Users
                                    </button>
                                    <div className="border-t border-slate-700 my-1"></div>
                                    <button
                                      onClick={() => {
                                        setShowMenu(false);
                                        setSimScreen('auth');
                                      }}
                                      className="w-full text-left px-3 py-2 text-rose-400 hover:bg-slate-700"
                                    >
                                      Sign Out
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Main Tab Content */}
                      <div className="flex-1 overflow-y-auto">
                        {simActiveTab === 'chats' && (
                          <div className="divide-y divide-slate-800/80">
                            {conversations
                              .filter((c) =>
                                c.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
                                c.lastMessage.toLowerCase().includes(searchFilter.toLowerCase())
                              )
                              .map((conv) => (
                                <button
                                  key={conv.id}
                                  onClick={() => {
                                    setActiveConvId(conv.id);
                                    setSimScreen('chat');
                                  }}
                                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-900 text-left transition-colors"
                                >
                                  <img
                                    src={conv.photoUrl}
                                    alt={conv.title}
                                    className="w-11 h-11 rounded-full object-cover border border-slate-800"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <h3 className="text-xs font-semibold text-white truncate">
                                        {conv.title}
                                      </h3>
                                      <span className="text-[10px] text-slate-400">
                                        {conv.lastMessageTime}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      {conv.lastMessageSenderId === currentUser.uid && (
                                        <CheckCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                      )}
                                      <p className="text-[11px] text-slate-400 truncate">
                                        {conv.lastMessage}
                                      </p>
                                    </div>
                                  </div>
                                  {conv.unreadCount > 0 && (
                                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                                      {conv.unreadCount}
                                    </span>
                                  )}
                                </button>
                              ))}
                          </div>
                        )}

                        {simActiveTab === 'contacts' && (
                          <div className="p-3 space-y-3">
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                              <input
                                type="text"
                                value={contactQuery}
                                onChange={(e) => setContactQuery(e.target.value)}
                                placeholder="Search by username..."
                                className="w-full bg-slate-900 border border-slate-800 text-xs text-white pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500"
                              />
                            </div>

                            <p className="text-[10px] text-slate-400">
                              Registered Mitra Users (Privacy Protected):
                            </p>

                            <div className="space-y-2">
                              {TEST_USERS.filter((u) => u.uid !== currentUser.uid).map((user) => (
                                <div
                                  key={user.uid}
                                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <img
                                      src={user.photoUrl}
                                      alt={user.displayName}
                                      className="w-9 h-9 rounded-full object-cover"
                                    />
                                    <div>
                                      <h4 className="text-xs font-semibold text-white">
                                        {user.displayName}
                                      </h4>
                                      <span className="text-[10px] text-emerald-400">
                                        @{user.searchableUsername}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setActiveConvId('direct_lakshmi_aarav');
                                      setSimScreen('chat');
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-medium hover:bg-emerald-500"
                                  >
                                    Chat
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {simActiveTab === 'settings' && (
                          <div className="p-4 space-y-4 text-xs">
                            <div
                              onClick={() => setSimScreen('profile')}
                              className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center gap-3 cursor-pointer hover:border-slate-700"
                            >
                              <img
                                src={currentUser.photoUrl}
                                alt={currentUser.displayName}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                              <div>
                                <h3 className="font-bold text-sm text-white">{profileName}</h3>
                                <p className="text-[11px] text-slate-400">@{currentUser.searchableUsername}</p>
                                <p className="text-[11px] text-emerald-400 truncate mt-0.5">{profileStatus}</p>
                              </div>
                            </div>

                            <div className="bg-slate-900 rounded-xl border border-slate-800 divide-y divide-slate-800">
                              <div className="p-3 flex items-center justify-between">
                                <div>
                                  <div className="font-semibold text-white">Read Receipts</div>
                                  <div className="text-[10px] text-slate-400">Double blue ticks</div>
                                </div>
                                <span className="text-emerald-400 font-bold">Enabled</span>
                              </div>
                              <div className="p-3 flex items-center justify-between">
                                <div>
                                  <div className="font-semibold text-white">Firebase Security</div>
                                  <div className="text-[10px] text-slate-400">ABAC Firestore rules</div>
                                </div>
                                <span className="text-emerald-400 font-bold">Enforced</span>
                              </div>
                              <div className="p-3 flex items-center justify-between">
                                <div>
                                  <div className="font-semibold text-white">FCM Push Notifications</div>
                                  <div className="text-[10px] text-slate-400">Secure Cloud Functions</div>
                                </div>
                                <span className="text-sky-400 font-bold">Ready</span>
                              </div>
                            </div>

                            <button
                              onClick={() => setSimScreen('auth')}
                              className="w-full py-2.5 rounded-xl border border-rose-900/60 bg-rose-950/20 text-rose-400 font-semibold hover:bg-rose-900/30 flex items-center justify-center gap-2"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              Sign Out of Mitra Chat
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Bottom Navigation Bar */}
                      <div className="h-14 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-4">
                        <button
                          onClick={() => setSimActiveTab('chats')}
                          className={`flex flex-col items-center gap-1 ${
                            simActiveTab === 'chats' ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          <Smartphone className="w-4 h-4" />
                          <span className="text-[10px] font-medium">Chats</span>
                        </button>
                        <button
                          onClick={() => setSimActiveTab('contacts')}
                          className={`flex flex-col items-center gap-1 ${
                            simActiveTab === 'contacts' ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          <Users className="w-4 h-4" />
                          <span className="text-[10px] font-medium">Contacts</span>
                        </button>
                        <button
                          onClick={() => setSimActiveTab('settings')}
                          className={`flex flex-col items-center gap-1 ${
                            simActiveTab === 'settings' ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          <SettingsIcon className="w-4 h-4" />
                          <span className="text-[10px] font-medium">Settings</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3. CHAT ROOM SCREEN */}
                  {simScreen === 'chat' && (
                    <div className="flex-1 flex flex-col bg-[#0b141a]">
                      {/* Top Chat Bar */}
                      <div className="bg-[#008069] text-white px-3 py-2.5 flex items-center justify-between shadow">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSimScreen('home')}
                            className="p-1 -ml-1 text-white hover:text-white/80"
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </button>
                          <img
                            src={otherParticipant.photoUrl}
                            alt={otherParticipant.displayName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <h3 className="font-bold text-xs text-white leading-tight">
                              {otherParticipant.displayName}
                            </h3>
                            <span className="text-[10px] text-emerald-200">online</span>
                          </div>
                        </div>
                        <MoreVertical className="w-4 h-4 text-white/80" />
                      </div>

                      {/* Chat Messages Stream */}
                      <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
                        <div className="text-center my-1">
                          <span className="text-[9px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded-md">
                            TODAY • MESSAGES SECURED VIA CLOUD FIRESTORE
                          </span>
                        </div>

                        {currentChatMessages.map((msg) => {
                          const isMe = msg.senderId === currentUser.uid;
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                            >
                              <div
                                className={`max-w-[78%] rounded-2xl px-3 py-2 text-xs shadow-sm ${
                                  isMe
                                    ? 'bg-[#005c4b] text-white rounded-tr-none'
                                    : 'bg-[#202c33] text-slate-100 rounded-tl-none'
                                }`}
                              >
                                {msg.mediaUrl && (
                                  <img
                                    src={msg.mediaUrl}
                                    alt="attachment"
                                    className="rounded-lg mb-1.5 max-h-36 w-full object-cover"
                                  />
                                )}
                                <p className="leading-relaxed">{msg.text}</p>
                                <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-white/60">
                                  <span>{msg.time}</span>
                                  {isMe && (
                                    <CheckCheck className="w-3 h-3 text-sky-400" />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Quick Emoji Picker */}
                      {showEmojiPicker && (
                        <div className="bg-[#202c33] p-2 flex justify-around border-t border-slate-700 text-lg">
                          {['😀', '😂', '❤️', '👍', '🙏', '🔥', '🎉'].map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => {
                                setInputText((prev) => prev + emoji);
                                setShowEmojiPicker(false);
                              }}
                              className="hover:scale-125 transition-transform"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Input Bar */}
                      <div className="p-2 bg-[#202c33] flex items-center gap-1.5 border-t border-slate-800">
                        <button
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="p-1.5 text-slate-400 hover:text-white"
                        >
                          <Smile className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            // Demo attaching an image
                            const newMsg: SimMessage = {
                              id: `img_${Date.now()}`,
                              conversationId: activeConvId,
                              senderId: currentUser.uid,
                              senderName: currentUser.displayName,
                              text: 'Sent a screenshot of our Jetpack Compose UI!',
                              mediaUrl:
                                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
                              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                              status: 'READ'
                            };
                            setMessages((prev) => [...prev, newMsg]);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white"
                          title="Attach sample media"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>
                        <input
                          type="text"
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Type a message..."
                          className="flex-1 bg-[#2a3942] text-xs text-white px-3 py-2 rounded-full focus:outline-none placeholder:text-slate-400"
                        />
                        <button
                          onClick={handleSendMessage}
                          className="p-2 rounded-full bg-[#00a884] text-white hover:bg-[#008f6f] transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 4. USER PROFILE SCREEN */}
                  {simScreen === 'profile' && (
                    <div className="flex-1 flex flex-col bg-slate-950 p-4">
                      <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
                        <button onClick={() => setSimScreen('home')} className="text-slate-400 hover:text-white">
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <h2 className="font-bold text-sm text-white">Profile Details</h2>
                      </div>

                      <div className="flex flex-col items-center py-6">
                        <img
                          src={currentUser.photoUrl}
                          alt={profileName}
                          className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500 shadow-lg"
                        />
                        <span className="text-[11px] text-slate-400 mt-2 font-mono">
                          UID: {currentUser.uid}
                        </span>
                      </div>

                      <div className="space-y-3 text-xs flex-1">
                        <div>
                          <label className="text-[10px] text-slate-400 font-medium">Display Name</label>
                          <input
                            type="text"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="w-full mt-1 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 font-medium">Searchable Username</label>
                          <input
                            type="text"
                            value={`@${currentUser.searchableUsername}`}
                            disabled
                            className="w-full mt-1 bg-slate-900/60 border border-slate-800 px-3 py-2 rounded-xl text-slate-400 cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 font-medium">About / Status</label>
                          <input
                            type="text"
                            value={profileStatus}
                            onChange={(e) => setProfileStatus(e.target.value)}
                            className="w-full mt-1 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-white"
                          />
                        </div>

                        <button
                          onClick={() => setSimScreen('home')}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs mt-4"
                        >
                          Save Changes
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete your account?')) {
                            setSimScreen('auth');
                          }
                        }}
                        className="w-full py-2 rounded-xl border border-rose-900/50 bg-rose-950/20 text-rose-400 text-xs font-medium flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Account
                      </button>
                    </div>
                  )}

                  {/* Android Gesture Bar */}
                  <div className="h-4 bg-slate-950 flex items-center justify-center">
                    <div className="w-24 h-1 bg-slate-600 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Native Android Source Code Inspector */}
        {activeTab === 'code' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: File Tree */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-semibold text-sm text-white">Project File Tree</h3>
                </div>
                <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                  {ANDROID_PROJECT_FILES.length} Files
                </span>
              </div>

              <div className="space-y-1 max-h-[620px] overflow-y-auto pr-1">
                {ANDROID_PROJECT_FILES.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      selectedFile.path === file.path
                        ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/40 font-medium'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          file.category === 'kotlin'
                            ? 'bg-purple-400'
                            : file.category === 'gradle'
                            ? 'bg-sky-400'
                            : file.category === 'rules'
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                      />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-50" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Code Viewer */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-mono text-sm text-emerald-400 font-bold">{selectedFile.path}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedFile.description}</p>
                </div>
                <button
                  onClick={() => handleCopyCode(selectedFile.content, selectedFile.path)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                >
                  {copiedFile === selectedFile.path ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy File</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-950 rounded-xl p-4 overflow-x-auto max-h-[580px] border border-slate-800/80 font-mono text-xs text-slate-300 leading-relaxed">
                <pre>
                  <code>{selectedFile.content}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Firebase & Google Play Console Guide */}
        {activeTab === 'firebase' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Firebase & Google Services Integration Guide</h2>
                  <p className="text-xs text-slate-400">
                    Target Package: <code className="text-emerald-400 font-mono">com.mitrachat.app</code> • Real configuration requires placing your downloaded credentials
                  </p>
                </div>
              </div>

              {/* Status Alert */}
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div className="text-xs space-y-1">
                  <div className="font-semibold text-amber-300">Status: Waiting for real `google-services.json` file</div>
                  <div className="text-slate-300 leading-relaxed">
                    The Gradle build files, dependencies, and manifest permissions are fully configured. To connect your live Firebase project, download <code className="text-amber-200 font-mono">google-services.json</code> from the Firebase Console and place it at <code className="text-emerald-300 font-mono">android/app/google-services.json</code>.
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wide">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                      1
                    </span>
                    Register Android Package Name
                  </div>
                  <p className="text-xs text-slate-300">
                    In Firebase Console, add an Android app with package name{' '}
                    <code className="text-emerald-300 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                      com.mitrachat.app
                    </code>
                    .
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wide">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                      2
                    </span>
                    Extract & Verify SHA-1 & SHA-256 Signing Fingerprints
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Android Credential Manager & Google Sign-In require your keystore SHA-1 to be registered in Firebase. Without it, Google login will fail with <code className="text-rose-400 font-mono">ApiException: 10</code>.
                  </p>
                  <div className="space-y-2">
                    <div className="text-[11px] text-slate-400 font-semibold">Option A — Using Gradle (Fastest):</div>
                    <pre className="bg-slate-900 p-2.5 rounded-lg text-emerald-300 font-mono text-[11px] overflow-x-auto">
                      cd android && ./gradlew signingReport
                    </pre>
                    <div className="text-[11px] text-slate-400 font-semibold mt-2">Option B — Using Keytool (Terminal):</div>
                    <pre className="bg-slate-900 p-2.5 rounded-lg text-emerald-300 font-mono text-[11px] overflow-x-auto">
                      {/* Windows */}
                      keytool -list -v -alias androiddebugkey -keystore "%USERPROFILE%\\.android\\debug.keystore" -storepass android -keypass android
                    </pre>
                    <div className="text-[11px] text-slate-400 font-semibold mt-2">Where to add in Firebase Console:</div>
                    <p className="text-xs text-slate-300">
                      Go to <strong>Firebase Console</strong> &rarr; <strong>Project Settings</strong> &rarr; <strong>Your Apps</strong> &rarr; select <strong>com.mitrachat.app</strong> &rarr; scroll to <strong>SHA certificate fingerprints</strong> &rarr; click <strong>Add fingerprint</strong> &rarr; Paste your SHA-1.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wide">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                      3
                    </span>
                    Download `google-services.json`
                  </div>
                  <p className="text-xs text-slate-300">
                    Download the configuration file from Firebase and place it at:{' '}
                    <code className="text-emerald-300 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                      android/app/google-services.json
                    </code>
                    .
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wide">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                      4
                    </span>
                    Deploy Security Rules & Cloud Functions
                  </div>
                  <p className="text-xs text-slate-300">
                    Deploy hardened Firestore ABAC rules and FCM notification trigger from your command line:
                  </p>
                  <pre className="bg-slate-900 p-2.5 rounded-lg text-emerald-300 font-mono text-[11px]">
                    firebase deploy --only firestore:rules,storage,functions
                  </pre>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wide">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                      5
                    </span>
                    Google Play Internal Testing Release
                  </div>
                  <p className="text-xs text-slate-300">
                    Generate the production Android App Bundle ready for Play Console upload:
                  </p>
                  <pre className="bg-slate-900 p-2.5 rounded-lg text-emerald-300 font-mono text-[11px]">
                    cd android && ./gradlew bundleRelease
                  </pre>
                </div>

                {/* Mobile Specific Section */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/40 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wide">
                    <Smartphone className="w-4 h-4" />
                    Developing & Building on Mobile (Without a PC)
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    If you are creating and testing this app directly on your smartphone:
                  </p>
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                      <strong className="text-white block mb-1">Option 1: Build APK via GitHub Actions (Free Cloud Build)</strong>
                      <span>A ready workflow is included at <code className="text-emerald-300">.github/workflows/android-build.yml</code>. Push this repo to GitHub, and GitHub will automatically compile the APK and output a downloadable <code className="text-amber-300">app-debug.apk</code> you can install directly on your phone!</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                      <strong className="text-white block mb-1">Option 2: Firebase Console on Mobile Browser</strong>
                      <span>Open Chrome on your phone, tap the 3 dots menu &rarr; enable <strong>&ldquo;Desktop site&rdquo;</strong> to access Firebase Project Settings, upload SHA-1, and download <code className="text-emerald-300">google-services.json</code> with ease.</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                      <strong className="text-white block mb-1">Option 3: Test Real-Time Chat Right Now</strong>
                      <span>You can use the <strong>Device Simulator</strong> tab above directly on your phone screen to test Google Login simulation, real-time message exchange between Lakshmi, Aarav, and Priya, unread counts, and profile updates!</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
