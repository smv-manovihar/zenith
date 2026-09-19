import { type FC } from "react"
import { PageHeader } from "@/components/PageHeader"
import { HelpBullets, HelpSteps } from "@/components/PageHelp"

export const ReviewHeader: FC = () => {
  return (
    <div>
      <PageHeader
        title="Review Matches"
        description="Verify and match imported entries with AniList records."
        backTo="/import"
        helpSections={[
          {
            title: "About",
            content: (
              <p>
                Review matches each title you imported against real AniList
                records. This is where you confirm Zenith picked the right
                show, choose sequels or related entries, and set the score,
                status, and progress that will be synced.
              </p>
            ),
          },
          {
            title: "What to do",
            content: (
              <HelpSteps>
                <li>Check the suggested matches for the current title.</li>
                <li>Tick the entries you actually watched.</li>
                <li>Set score, status, and progress for each ticked entry.</li>
                <li>Move to the next title with Next or Previous.</li>
                <li>Press Finalize when everything is resolved to go to sync.</li>
              </HelpSteps>
            ),
          },
          {
            title: "Tips",
            content: (
              <HelpBullets>
                <li>
                  You can tick several related entries for one title, such as
                  sequels, movies, and OVAs.
                </li>
                <li>
                  Use the sidebar, search, or missing scores filter to jump
                  around, or open full details before deciding.
                </li>
                <li>
                  Entries with a zero score are flagged as missing. Sync stays
                  blocked until they are filled in.
                </li>
                <li>
                  Your place is remembered, so you can leave and continue
                  later from the same title.
                </li>
              </HelpBullets>
            ),
          },
        ]}
      />
    </div>
  )
}
