using UnityEngine;

namespace GetData2
{
    public class Loader
    {
        static GameObject gameObject;
        public static void Load()
        {
            if (GameObject.Find("MTGAProDataGetter") == null)
            {
                gameObject = new GameObject("MTGAProDataGetter");
                gameObject.AddComponent<MTGAProGetData>();
                Object.DontDestroyOnLoad(gameObject);
            }
            else {
                Debug.Log($"[MTGA.Pro Logger] Logger is already in place, no need to embed it again!");
            }
        }

        public static void Unload()
        {
            Object.Destroy(gameObject);
        }
    }
}
