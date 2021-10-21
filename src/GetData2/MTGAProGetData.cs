using System;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json;
using UnityEngine;
using Wizards.Mtga.FrontDoorModels;

namespace GetData2
{
    public class LogElement
    {
        public string timestamp;
        public object Payload;
    }

    public class DeckForLog
    {
        public string Name;
        public Wizards.Mtga.Decks.Client_DeckContents Deck;
    }
    public class MTGAProGetData : MonoBehaviour
    {
        private static bool gotInventoryData = false;
        private static bool gotLoginData = false;
        private static bool gotRankInfo = false;
        private static readonly UnityCrossThreadLogger MTGAProLogger = new UnityCrossThreadLogger("MTGA.Pro Logger");
        public void Start()
        {
            try
            {
                System.Random RNG = new System.Random();
                int length = 32;
                string rString = "";
                for (var i = 0; i < length; i++)
                {
                    rString += ((char)(RNG.Next(1, 26) + 64)).ToString().ToLower();
                }
                MTGAProLogger.Debug($" Unique Log Identifier: {rString}");
                Task task = new Task(() => GetHoldOnPapa());
                task.Start();
            }
            catch (Exception e)
            {
                WriteToLog("Error", e);
            }

        }


        private void GetHoldOnPapa()
        {
            try
            {
                Thread.Sleep(10000);

                if (!gotLoginData && WrapperController.Instance != null && WrapperController.Instance.AccountClient != null && WrapperController.Instance.AccountClient.AccountInformation != null)
                {
                    PrintAccountInfo();
                }

                if (!gotInventoryData && WrapperController.Instance != null && WrapperController.Instance.InventoryManager != null && WrapperController.Instance.InventoryManager.Cards != null && WrapperController.Instance.InventoryManager.Cards.Count > 0)
                {
                    GetInventoryData();
                }
                
                if (!gotRankInfo && PAPA.Legacy.CombinedRankInfo != null)
                {
                    PrintCombinedRankInfo();
                }
                
                
                if (gotInventoryData && gotLoginData && gotRankInfo)
                {
                    return;
                }
                else
                {
                    GetHoldOnPapa();
                }

            }
            catch (Exception e)
            {
                WriteToLog("ErrorGetHoldOnPapa", e);
                Thread.Sleep(10000);
                GetHoldOnPapa();
            }
        }

        private void WriteToLog(string indicator, object report)
        {
            try
            {
                LogElement logElem = new LogElement
                {
                    Payload = report,
                    timestamp = new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds().ToString()
                };
                MTGAProLogger.Debug($" **{indicator}** {JsonConvert.SerializeObject(logElem)}");
            }
            catch (Exception e)
            {
                MTGAProLogger.Debug($" **WriteToLogError** {e}");
            }
        }

        private void PrintCombinedRankInfo()
        {
            try
            {
                gotRankInfo = true;
                WriteToLog("CombinedRankInfo", PAPA.Legacy.CombinedRankInfo);
            }
            catch (Exception e)
            {
                WriteToLog("ErrorCombinedRankInfo", e);
            }
        }

        private void PrintAccountInfo()
        {
            try
            {
                gotLoginData = true;
                WrapperController.Instance.AccountClient.LoginStateChanged += AccountClient_LoginStateChanged;
                WriteToLog("Userdata", new { userId = WrapperController.Instance.AccountClient.AccountInformation.AccountID, screenName = WrapperController.Instance.AccountClient.AccountInformation.DisplayName });
            }
            catch (Exception e)
            {
                WriteToLog("ErrorPrintAccountInfo", e);
            }
        }

        private void GetInventoryData()
        {
            try
            {
                gotInventoryData = true;
                WrapperController.Instance.InventoryManager.UnsubscribeFromAll(InventoryChangeHandler);
                WrapperController.Instance.InventoryManager.SubscribeToAll(InventoryChangeHandler);

                PAPA.SceneLoading.OnWrapperSceneLoaded += onWrapperSceneLoaded;
                PAPA.SceneLoading.OnDuelSceneLoaded += onDuelSceneLoaded;

                WriteToLog("Collection", WrapperController.Instance.InventoryManager.Cards);
                WriteToLog("InventoryContent", WrapperController.Instance.InventoryManager.Inventory);   

                Task task = new Task(() => PeriodicCollectionPrinter());
                task.Start();
            }
            catch (Exception e)
            {
                WriteToLog("ErrorGetInitialData", e);
            }
        }

        private void onWrapperSceneLoaded(object obj)
        {
            WriteToLog("onWrapperSceneLoaded", obj);
            WriteToLog("onWrapperSceneLoaded", PAPA.SceneLoading.CurrentScene);
            if (WrapperController.Instance.PostMatchClientUpdate != null)
            {
                WriteToLog("onWrapperSceneLoadedPostMatchClientUpdate", WrapperController.Instance.PostMatchClientUpdate);
            }
        }

        private void onDuelSceneLoaded(UnityEngine.SceneManagement.LoadSceneMode obj)
        {
            WriteToLog("onDuelSceneLoaded", obj);
            WriteToLog("onDuelSceneLoaded", PAPA.SceneLoading.CurrentScene);
            if (WrapperController.Instance.PostMatchClientUpdate != null)
            {
                WriteToLog("onWrapperSceneLoadedPostMatchClientUpdate", WrapperController.Instance.PostMatchClientUpdate);
            }
        }

        private void PeriodicCollectionPrinter()
        {
            try
            {
               Thread.Sleep(600000);
               WriteToLog("Collection", WrapperController.Instance.InventoryManager.Cards);
               WriteToLog("InventoryContent", WrapperController.Instance.InventoryManager.Inventory);
               PeriodicCollectionPrinter();
            }
            catch (Exception e)
            {
                WriteToLog("ErrorPeriodicCollectionPrinter", e);
            }
        }

        private void AccountClient_LoginStateChanged(LoginState obj)
        {
            try
            {
                WriteToLog("LoginStateChanged", obj);
                gotInventoryData = false;
                gotLoginData = false;
                gotRankInfo = false;
                Task task = new Task(() => GetHoldOnPapa());
                task.Start();
            }
            catch (Exception e)
            {
                WriteToLog("ErrorLoginStateChanged", e);
            }
        }

        private void InventoryChangeHandler(ClientInventoryUpdateReportItem obj)
        {
            try
            {
                WriteToLog("InventoryUpdate", obj);
            }
            catch (Exception e)
            {
                WriteToLog("ErrorInventoryChangeHandler", e);
            }
        }


    }
}
