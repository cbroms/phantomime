using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
public class PlayerOrGhost : MonoBehaviour
{
    public bool GhostTrue; //This switches the mode of wether or not we are the player or the ghost.

    // Start is called before the first frame update
    void Start()
    {

    }

    // Update is called once per frame
    void Update()
    {

    }


    //Because the editor for some reason does not like two paramenters I sepreated the two functions when you click.

    public void ClickHighlight(GameObject Highlight) //This function is called on clicking a button and only works if it is a ghost. It turns on the highlights.
    {
        if (GhostTrue)
        {
            Highlight.SetActive(true);
        }


    }

    //This activates when you click a button and it will only work if you are not a ghost, and it will change the scene.

    public void ClickScene(int SceneNum)
    {
        if (!GhostTrue)
        {
            SceneManager.LoadScene(SceneNum);
        }
    }

    //This is used in the task scene and allows you to exit and go back.

public void ExitBack(int sceneANumber)
    {
        SceneManager.LoadScene(sceneANumber);
    }
}
