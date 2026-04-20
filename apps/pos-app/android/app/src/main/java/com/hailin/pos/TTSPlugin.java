package com.hailin.pos;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.HashMap;
import java.util.Locale;

@CapacitorPlugin(name = "TTS")
public class TTSPlugin extends Plugin implements TextToSpeech.OnInitListener {

    private static final String TAG = "TTSPlugin";
    
    private TextToSpeech tts = null;
    private boolean isInitialized = false;
    private AudioManager audioManager = null;
    private AudioFocusRequest focusRequest = null;
    
    // 默认语音参数
    private float speechRate = 1.0f;
    private float pitch = 1.0f;
    private String language = "zh-CN";

    @Override
    public void load() {
        super.load();
        Context context = getContext();
        audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        
        // 初始化 TTS 引擎
        tts = new TextToSpeech(context, this);
        
        Log.i(TAG, "TTS 插件加载中...");
    }

    @Override
    public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS) {
            isInitialized = true;
            
            // 设置语言
            int langResult = tts.setLanguage(new Locale("zh", "CN"));
            
            if (langResult == TextToSpeech.LANG_MISSING_DATA || 
                langResult == TextToSpeech.LANG_NOT_SUPPORTED) {
                Log.w(TAG, "中文语言包不可用，尝试使用默认语言");
                tts.setLanguage(Locale.getDefault());
            }
            
            // 设置语速和音调
            tts.setSpeechRate(speechRate);
            tts.setPitch(pitch);
            
            // 设置 TTS 回调监听
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override
                public void onStart(String utteranceId) {
                    notifyListeners("tts-start", createResult("start", utteranceId));
                }

                @Override
                public void onDone(String utteranceId) {
                    notifyListeners("tts-end", createResult("end", utteranceId));
                    // 释放音频焦点
                    abandonAudioFocus();
                }

                @Override
                public void onError(String utteranceId) {
                    notifyListeners("tts-error", createResult("error", utteranceId));
                    abandonAudioFocus();
                }
            });
            
            Log.i(TAG, "TTS 初始化成功，语言: " + language);
            notifyListeners("tts-ready", createResult("ready", null));
        } else {
            isInitialized = false;
            Log.e(TAG, "TTS 初始化失败，状态: " + status);
            notifyListeners("tts-error", createResult("init_failed", "TTS初始化失败"));
        }
    }

    /**
     * 语音播报
     */
    @PluginMethod
    public void speak(PluginCall call) {
        if (!isInitialized) {
            call.reject("TTS 尚未初始化");
            return;
        }

        String text = call.getString("text", "");
        if (text == null || text.isEmpty()) {
            call.reject("文本内容不能为空");
            return;
        }

        // 获取可选参数
        String utteranceId = call.getString("id", "tts_" + System.currentTimeMillis());
        Float rate = call.getFloat("rate", speechRate);
        Float pitchVal = call.getFloat("pitch", pitch);
        
        // 申请音频焦点
        if (!requestAudioFocus()) {
            Log.w(TAG, "无法获取音频焦点，语音可能无法正常播放");
        }
        
        // 设置语速和音调
        tts.setSpeechRate(rate);
        tts.setPitch(pitchVal);

        Bundle params = new Bundle();
        params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f);
        params.putFloat(TextToSpeech.Engine.KEY_PARAM_PAN, 0.0f);

        HashMap<String, String> extraParams = new HashMap<>();
        extraParams.put(TextToSpeech.Engine.KEY_PARAM_STREAM, String.valueOf(AudioManager.STREAM_MUSIC));
        extraParams.put(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId);

        int result = tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, utteranceId);
        
        if (result == TextToSpeech.SUCCESS) {
            Log.i(TAG, "语音播报开始: " + text);
            call.resolve(createResult("speaking", utteranceId));
        } else {
            call.reject("语音播报失败");
            abandonAudioFocus();
        }
    }

    /**
     * 停止播报
     */
    @PluginMethod
    public void stop(PluginCall call) {
        if (tts != null) {
            tts.stop();
            abandonAudioFocus();
            call.resolve(createResult("stopped", null));
        } else {
            call.reject("TTS 未初始化");
        }
    }

    /**
     * 获取 TTS 状态
     */
    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("initialized", isInitialized);
        result.put("speaking", tts != null && tts.isSpeaking());
        result.put("language", language);
        result.put("speechRate", speechRate);
        result.put("pitch", pitch);
        result.put("availableLanguages", getAvailableLanguages());
        call.resolve(result);
    }

    /**
     * 设置语言
     */
    @PluginMethod
    public void setLanguage(PluginCall call) {
        String lang = call.getString("language", "zh-CN");
        
        if (tts == null || !isInitialized) {
            call.reject("TTS 未初始化");
            return;
        }
        
        Locale locale;
        switch (lang) {
            case "en-US":
                locale = Locale.US;
                break;
            case "en-GB":
                locale = Locale.UK;
                break;
            case "ja-JP":
                locale = Locale.JAPANESE;
                break;
            case "zh-CN":
            default:
                locale = new Locale("zh", "CN");
                break;
        }
        
        int result = tts.setLanguage(locale);
        
        if (result == TextToSpeech.LANG_MISSING_DATA || 
            result == TextToSpeech.LANG_NOT_SUPPORTED) {
            call.reject("不支持的语言: " + lang);
        } else {
            this.language = lang;
            call.resolve(createResult("language_set", lang));
        }
    }

    /**
     * 设置语速
     */
    @PluginMethod
    public void setSpeechRate(PluginCall call) {
        float rate = call.getFloat("rate", 1.0f);
        
        if (rate < 0.1f || rate > 10.0f) {
            call.reject("语速范围应为 0.1 - 10.0");
            return;
        }
        
        this.speechRate = rate;
        if (tts != null) {
            tts.setSpeechRate(rate);
        }
        call.resolve(createResult("rate_set", String.valueOf(rate)));
    }

    /**
     * 设置音调
     */
    @PluginMethod
    public void setPitch(PluginCall call) {
        float pitchVal = call.getFloat("pitch", 1.0f);
        
        if (pitchVal < 0.1f || pitchVal > 10.0f) {
            call.reject("音调范围应为 0.1 - 10.0");
            return;
        }
        
        this.pitch = pitchVal;
        if (tts != null) {
            tts.setPitch(pitchVal);
        }
        call.resolve(createResult("pitch_set", String.valueOf(pitchVal)));
    }

    /**
     * 检查语言是否可用
     */
    @PluginMethod
    public void isLanguageAvailable(PluginCall call) {
        String lang = call.getString("language", "zh-CN");
        
        Locale locale;
        switch (lang) {
            case "en-US":
                locale = Locale.US;
                break;
            case "zh-CN":
            default:
                locale = new Locale("zh", "CN");
                break;
        }
        
        int result = tts != null ? tts.isLanguageAvailable(locale) : TextToSpeech.LANG_NOT_SUPPORTED;
        
        JSObject ret = new JSObject();
        ret.put("available", result == TextToSpeech.LANG_AVAILABLE || 
                           result == TextToSpeech.LANG_COUNTRY_AVAILABLE ||
                           result == TextToSpeech.LANG_COUNTRY_VAR_AVAILABLE);
        ret.put("code", result);
        ret.put("language", lang);
        
        call.resolve(ret);
    }

    private JSObject createResult(String status, String data) {
        JSObject result = new JSObject();
        result.put("status", status);
        if (data != null) {
            result.put("data", data);
        }
        return result;
    }

    private JSObject getAvailableLanguages() {
        JSObject languages = new JSObject();
        if (tts != null) {
            for (Locale locale : tts.getAvailableLanguages()) {
                languages.put(locale.toString(), true);
            }
        }
        return languages;
    }

    private boolean requestAudioFocus() {
        if (audioManager == null) return false;
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioAttributes playbackAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ASSISTANT)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build();
            
            focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
                    .setAudioAttributes(playbackAttributes)
                    .setAcceptsDelayedFocusInput(true)
                    .setWillPauseWhenDucked(false)
                    .build();
            
            int result = audioManager.requestAudioFocus(focusRequest);
            return result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
        } else {
            @SuppressWarnings("deprecation")
            int result = audioManager.requestAudioFocus(
                    null,
                    AudioManager.STREAM_MUSIC,
                    AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
            );
            return result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
        }
    }

    private void abandonAudioFocus() {
        if (audioManager != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && focusRequest != null) {
                audioManager.abandonAudioFocusRequest(focusRequest);
            } else {
                audioManager.abandonAudioFocus(null);
            }
        }
    }

    @Override
    protected void handleOnDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
            tts = null;
        }
        abandonAudioFocus();
        super.handleOnDestroy();
    }
}
