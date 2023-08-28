import { log } from "cc";
import { bridge } from "../../core/Bridge";
import { route } from "../../core/Route";
import { InterstitialAdLoadCalLBackNTF, InterstitialFullScreenContentCallbackNTF, LoadInterstitialAdACK, LoadInterstitialAdREQ, ShowInterstitialAdACK, ShowInterstitialAdREQ } from "../../proto/InterstitailAd";
import { AdClient } from "./AdClient";
import { InterstitialAdListener } from "../listener/InterstitialAdListener";
import { InterstitialPaidEventNTF } from "../../proto/PaidEventNTF";
import { OnPaidEventListener } from "../listener/OnPaidEventListener";
import { js } from "cc";

/**
 * @zh
 * Interstitial 广告的客户端
 * @en
 * The client of Interstitial Ad.
 */
const module = "[InterstitialAdClient]"
export class InterstitialAdClient extends AdClient {

    /**
     * @zh
     * Interstitial 广告监听器，由多种类型联合
     * @en
     * Union of all the InterstitialAd listeners.
     */
    private _interstitialListener: InterstitialAdListener;

    /**
     * @zh
     * Interstitial 广告监听器，由多种类型联合
     * @en
     * Union of all the InterstitialAd listeners.
     */
    get interstitialListener(): InterstitialAdListener {
        return this._interstitialListener;
    }

    /**
     * @zh
     * Interstitial 广告监听器，由多种类型联合
     * @en
     * Union of all the InterstitialAd listeners.
     */
    set interstitialListener(value: InterstitialAdListener) {
        if (!value) {
            route.off(js.getClassName(InterstitialFullScreenContentCallbackNTF), this.onInterstitialFullScreenContentCallback, this);
            route.off(js.getClassName(InterstitialAdLoadCalLBackNTF), this.onInterstitialAdLoadCalLBackNTF, this);
            route.off(js.getClassName(InterstitialPaidEventNTF), this.onPaidEvent, this);
        }

        this._interstitialListener = value;

        if (value) {
            route.on(js.getClassName(InterstitialFullScreenContentCallbackNTF), this.onInterstitialFullScreenContentCallback, this);
            route.on(js.getClassName(InterstitialAdLoadCalLBackNTF), this.onInterstitialAdLoadCalLBackNTF, this);
            route.on(js.getClassName(InterstitialPaidEventNTF), this.onPaidEvent, this);
        }
    }

    /**
     * @zh
     *  加载 Interstitial  广告
     * @en
     *  Load the Interstitial Ad
     * @param unitId  
     *  @zh 单元Id
     *  @en the unit id of Interstitial Ad.
     * @param interstitialListener 
     *  @zh Interstitial 监听器
     *  @en Listener for the Interstitial Ad.
     */
    load(unitId: string, interstitialListener?: InterstitialAdListener) {
        this.destroy();
        log(module, `load, unitId = ${unitId}`);
        this.unitId = unitId;
        this.interstitialListener = interstitialListener;

        bridge.sendToNative(js.getClassName(LoadInterstitialAdREQ), { unitId: unitId }, js.getClassName(LoadInterstitialAdACK), (ack: LoadInterstitialAdACK) => {
            log(module, `load, LoadInterstitialAdACK, ${ack}`);
        });
    }

    /**
     * @zh
     * 销毁 Interstitial  的监听器
     * @en
     * Destroy the listener
     */
    destroy() {
        log(module, `destroy`);
        this.interstitialListener = null;        
    }

    /**
     * @zh
     * 展示 Interstitial 广告
     * 必须先 load 并且在成功后（onAdLoaded）后展示
     * @en
     * Show the Interstitial Ad.
     * Must be loaded first, and show in the onAdLoaded callback.
     * @param onComplete 
     */
    show(onComplete?: () => void) {
        log(module, `show`);
        bridge.sendToNative(js.getClassName(ShowInterstitialAdREQ), { unitId: this.unitId }, js.getClassName(ShowInterstitialAdACK), (ack: ShowInterstitialAdACK) => {
            if (onComplete) {
                onComplete();
            }
        });
    }

    private onInterstitialAdLoadCalLBackNTF(ntf: InterstitialAdLoadCalLBackNTF) {
        log(module, `onInterstitialAdLoadCalLBackNTF, ${ntf}`);
        if (this.interstitialListener) {
            let method = this.interstitialListener[ntf.method];
            if (method) {
                method(ntf.loadAdError);
            }
        }
    }

    private onInterstitialFullScreenContentCallback(ntf: InterstitialFullScreenContentCallbackNTF) {
        log(module, `onInterstitialFullScreenContentCallback, ${ntf}`);
        const method = this.interstitialListener[ntf.method];
        if (method) {
            method();
        }
    }

    private onPaidEvent(ntf:InterstitialPaidEventNTF){
        const listener = this.interstitialListener as OnPaidEventListener<InterstitialPaidEventNTF>;
        if(listener && listener.onPaidEvent){
            listener.onPaidEvent(ntf);
        }        
    }
}