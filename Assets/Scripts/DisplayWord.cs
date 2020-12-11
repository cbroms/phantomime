using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class DisplayWord : MonoBehaviour
{
    public Text Wordbox;
    // Start is called before the first frame update
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        Wordbox.text = Net.manager.currGameState.taskWords[Net.manager.currGameState.currentTask][Net.manager.currGameState.currentWord];

    }
}
