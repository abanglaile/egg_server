\version "2.18.2"
#(set! paper-alist (cons '("my size" . (cons (* 27 mm) (* 26 mm))) paper-alist))

\header { 
  tagline = ""  % removed 
} 

\paper {
  #(set-paper-size "my size")
}
\layout {
  \context {
    \Staff
    \remove "Time_signature_engraver"
  }
}
{
 \new PianoStaff <<
    \new Staff { \time 1/1 \key c \major < f' a' c'' >1   }
    \new Staff { \clef "bass" \key  c\major < ees > }
  >>
}